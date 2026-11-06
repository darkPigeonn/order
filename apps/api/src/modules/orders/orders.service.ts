import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";
import { hasPermission } from "../../common/auth/role-permissions";
import { OrderStatus } from "../../common/enums/order-status.enum";
import { PickupMethod } from "../../common/enums/pickup-method.enum";
import { Permission } from "../../common/enums/permission.enum";
import { AuthenticatedUser } from "../../common/interfaces/authenticated-user";
import { buildPageMeta, Paginated } from "../../common/interfaces/paginated";
import { escapeRegex, resolveSort } from "../../common/utils/sort-query";
import { Role } from "../../common/enums/role.enum";
import { NotificationsService } from "../notifications/notifications.service";
import { ProductsService } from "../products/products.service";
import { StockService } from "../stock/stock.service";
import { StoresService } from "../stores/stores.service";
import { canTransition } from "./domain/order-state.machine";
import { CreateOrderDto } from "./dto/create-order.dto";
import { ListOrdersQuery } from "./dto/list-orders.query";
import { PickupOrderDto } from "./dto/pickup-order.dto";
import { RecordFinanceDto } from "./dto/record-finance.dto";
import { OrderViewSource, toOrderResponse } from "./mappers/order.mapper";
import { Order, OrderDocument } from "./schemas/order.schema";
import { SequenceService } from "./sequence.service";

interface RefLike {
  _id?: Types.ObjectId;
  id?: string;
  name?: string;
  requireBarcode?: boolean;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    private readonly storesService: StoresService,
    private readonly productsService: ProductsService,
    private readonly stockService: StockService,
    private readonly sequenceService: SequenceService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateOrderDto, files: Express.Multer.File[], actor: AuthenticatedUser) {
    const store = await this.storesService.requireActive(dto.storeId);
    if (store.requireBarcode && files.length === 0) {
      throw new BadRequestException("Toko ini mewajibkan lampiran barcode");
    }

    const mergedItems = mergeItems(dto.items);
    const products = await this.productsService.findActiveByIds(mergedItems.map((item) => item.productId));
    const productById = new Map(products.map((product) => [product.id, product]));
    const reservation = mergedItems.map((item) => ({
      productId: item.productId,
      productName: productById.get(item.productId)!.name,
      quantity: item.quantity,
    }));

    await this.stockService.reserve(store.id, reservation);

    try {
      const now = new Date();
      const sequence = await this.sequenceService.next(orderSequenceKey(now));
      const order = await this.orderModel.create({
        orderNumber: formatOrderNumber(now, sequence),
        createdBy: actor.id,
        storeId: store.id,
        status: OrderStatus.PENDING_PICKUP,
        items: mergedItems.map((item) => {
          const product = productById.get(item.productId)!;
          return {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: item.quantity,
          };
        }),
        barcodes: files.map((file) => ({
          originalName: file.originalname,
          storedName: file.filename,
          mimeType: file.mimetype,
          size: file.size,
          url: this.fileUrl(file.filename),
        })),
        customerOrderNumber: dto.customerOrderNumber.trim(),
        recipientName: dto.recipientName.trim(),
        pickupMethod: dto.pickupMethod,
        traderName: dto.traderName.trim(),
        orderAmount: dto.orderAmount ?? null,
        note: dto.note?.trim() ?? "",
        finance: null,
        history: [
          {
            status: OrderStatus.PENDING_PICKUP,
            at: now,
            by: actor.id,
            note: "Pesanan dibuat",
          },
        ],
      });

      const response = await this.present(order.id, actor);
      await this.notificationsService.notifyRoles(
        [Role.SUB_ADMIN, Role.ADMIN, Role.SUPER_ADMIN],
        {
          title: "Pesanan baru",
          message: `${response.orderNumber} menunggu diambil di ${response.store.name}`,
          orderId: response.id,
        },
        actor.id,
      );
      return response;
    } catch (error) {
      await this.stockService.release(store.id, reservation);
      throw error;
    }
  }

  async list(query: ListOrdersQuery, actor: AuthenticatedUser) {
    const filter: FilterQuery<Order> = {};
    this.applyVisibility(filter, actor);
    if (query.status) filter.status = query.status;
    if (query.storeId) filter.storeId = query.storeId;
    if (query.q) {
      const pattern = new RegExp(escapeRegex(query.q.trim()), "i");
      filter.$or = [
        { orderNumber: pattern },
        { customerOrderNumber: pattern },
        { recipientName: pattern },
        { traderName: pattern },
      ];
    }

    const [total, rows] = await Promise.all([
      this.orderModel.countDocuments(filter),
      this.orderModel
        .find(filter)
        .sort(resolveSort(query.sortBy, query.sortDir, ["orderNumber", "status", "createdAt"], { field: "createdAt", direction: -1 }))
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .populate(ORDER_POPULATE),
    ]);

    return {
      data: rows.map((row) => toOrderResponse(this.toSource(row), actor.role)),
      meta: buildPageMeta(query.page, query.limit, total),
    } satisfies Paginated<ReturnType<typeof toOrderResponse>>;
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const order = await this.requireOrder(id);
    this.assertCanView(order, actor);
    const populated = await order.populate(ORDER_POPULATE);
    return toOrderResponse(this.toSource(populated), actor.role);
  }

  async pickup(id: string, dto: PickupOrderDto, actor: AuthenticatedUser) {
    const order = await this.requireOrder(id);
    this.moveStatus(order, OrderStatus.DONE_PICKUP, "Barang sudah diambil dan dicek di lapangan");
    const now = new Date();
    order.pickedUpBy = new Types.ObjectId(actor.id);
    order.pickedUpAt = now;
    order.history.push({
      status: OrderStatus.DONE_PICKUP,
      at: now,
      by: new Types.ObjectId(actor.id),
      note: dto.note?.trim() || "Barang sudah diambil",
    });
    await order.save();
    const response = await this.present(order.id, actor);
    await this.notificationsService.notifyUsers(
      [response.createdBy.id],
      {
        title: "Barang sudah diambil",
        message: `${response.orderNumber} sudah diambil dan menunggu penyelesaian`,
        orderId: response.id,
      },
      actor.id,
    );
    await this.notificationsService.notifyRoles(
      [Role.ADMIN, Role.SUPER_ADMIN],
      {
        title: "Siap dihitung",
        message: `${response.orderNumber} sudah diambil. Fee dan harga jual dapat diisi.`,
        orderId: response.id,
      },
      actor.id,
    );
    return response;
  }

  async recordFinance(id: string, dto: RecordFinanceDto, actor: AuthenticatedUser) {
    const order = await this.requireOrder(id);
    if (order.status !== OrderStatus.DONE_PICKUP) {
      throw new BadRequestException("Fee dan harga jual diisi setelah barang berstatus Sudah Diambil");
    }

    order.finance = {
      fee: dto.fee,
      sellingPrice: dto.sellingPrice,
      note: dto.note?.trim() ?? "",
      recordedBy: new Types.ObjectId(actor.id),
      recordedAt: new Date(),
    };
    await order.save();
    return this.present(order.id, actor);
  }

  async complete(id: string, actor: AuthenticatedUser) {
    const order = await this.requireOrder(id);
    if (!order.finance) {
      throw new BadRequestException("Isi fee dan harga jual sebelum menandai pesanan selesai");
    }

    this.moveStatus(order, OrderStatus.COMPLETED, "Pesanan diselesaikan");
    const now = new Date();
    order.completedBy = new Types.ObjectId(actor.id);
    order.completedAt = now;
    order.history.push({
      status: OrderStatus.COMPLETED,
      at: now,
      by: new Types.ObjectId(actor.id),
      note: "Pesanan selesai",
    });
    await order.save();
    const response = await this.present(order.id, actor);
    await this.notificationsService.notifyUsers(
      [response.createdBy.id],
      {
        title: "Pesanan selesai",
        message: `${response.orderNumber} telah selesai`,
        orderId: response.id,
      },
      actor.id,
    );
    return response;
  }

  async summary(actor: AuthenticatedUser) {
    const match: FilterQuery<Order> = {};
    this.applyVisibility(match, actor);

    const grouped = await this.orderModel.aggregate<{ _id: OrderStatus; count: number }>([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const counts = {
      [OrderStatus.PENDING_PICKUP]: 0,
      [OrderStatus.DONE_PICKUP]: 0,
      [OrderStatus.COMPLETED]: 0,
    };
    for (const row of grouped) {
      counts[row._id] = row.count;
    }

    const recent = await this.list({ page: 1, limit: 5 }, actor);
    const response: {
      counts: typeof counts;
      recent: typeof recent.data;
      finance?: { totalFee: number; totalSellingPrice: number; recordedCount: number };
    } = {
      counts,
      recent: recent.data,
    };

    if (hasPermission(actor.role, Permission.ORDER_FINANCE)) {
      const [finance] = await this.orderModel.aggregate<{
        totalFee: number;
        totalSellingPrice: number;
        recordedCount: number;
      }>([
        { $match: { ...match, finance: { $ne: null } } },
        {
          $group: {
            _id: null,
            totalFee: { $sum: "$finance.fee" },
            totalSellingPrice: { $sum: "$finance.sellingPrice" },
            recordedCount: { $sum: 1 },
          },
        },
      ]);

      response.finance = {
        totalFee: finance?.totalFee ?? 0,
        totalSellingPrice: finance?.totalSellingPrice ?? 0,
        recordedCount: finance?.recordedCount ?? 0,
      };
    }

    return response;
  }

  private moveStatus(order: OrderDocument, next: OrderStatus, reason: string) {
    if (!canTransition(order.status, next)) {
      throw new BadRequestException(
        `Status ${labelStatus(order.status)} tidak dapat diubah menjadi ${labelStatus(next)}. ${reason}`,
      );
    }
    order.status = next;
  }

  private applyVisibility(filter: FilterQuery<Order>, actor: AuthenticatedUser) {
    if (!hasPermission(actor.role, Permission.ORDER_READ_ALL)) {
      filter.createdBy = new Types.ObjectId(actor.id);
    }
  }

  private assertCanView(order: OrderDocument, actor: AuthenticatedUser) {
    if (hasPermission(actor.role, Permission.ORDER_READ_ALL)) {
      return;
    }

    if (String(order.createdBy) === actor.id) {
      return;
    }

    throw new ForbiddenException("Anda tidak dapat melihat pesanan ini");
  }

  private async requireOrder(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException("Pesanan tidak ditemukan");
    }
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException("Pesanan tidak ditemukan");
    }
    return order;
  }

  private async present(id: string, actor: AuthenticatedUser) {
    const order = await this.orderModel.findById(id).populate(ORDER_POPULATE);
    if (!order) {
      throw new NotFoundException("Pesanan tidak ditemukan");
    }
    return toOrderResponse(this.toSource(order), actor.role);
  }

  private toSource(order: OrderDocument): OrderViewSource {
    const store = asRef(order.storeId);
    const createdBy = asRef(order.createdBy);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerOrderNumber: order.customerOrderNumber ?? "",
      recipientName: order.recipientName ?? "",
      pickupMethod: order.pickupMethod ?? PickupMethod.SELF_PICK_UP,
      traderName: order.traderName ?? "",
      orderAmount: order.orderAmount ?? null,
      status: order.status,
      note: order.note,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      store: {
        id: store.id,
        name: store.name,
        requireBarcode: Boolean(store.requireBarcode),
      },
      createdBy,
      items: order.items.map((item) => ({
        productId: String(item.productId),
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
      })),
      barcodes: order.barcodes.map((file) => ({
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        url: file.url,
      })),
      finance: order.finance
        ? {
            fee: order.finance.fee,
            sellingPrice: order.finance.sellingPrice,
            note: order.finance.note,
            recordedAt: order.finance.recordedAt,
            recordedBy: asRef(order.finance.recordedBy),
          }
        : null,
      pickedUpAt: order.pickedUpAt,
      pickedUpBy: order.pickedUpBy ? asRef(order.pickedUpBy) : null,
      completedAt: order.completedAt,
      completedBy: order.completedBy ? asRef(order.completedBy) : null,
      history: order.history.map((event) => ({
        status: event.status,
        at: event.at,
        note: event.note,
        by: asRef(event.by),
      })),
    };
  }

  private fileUrl(filename: string) {
    const base = this.configService.getOrThrow<string>("publicBaseUrl").replace(/\/$/, "");
    return `${base}/uploads/barcodes/${filename}`;
  }
}

const ORDER_POPULATE = [
  { path: "storeId", select: "name requireBarcode" },
  { path: "createdBy", select: "name" },
  { path: "pickedUpBy", select: "name" },
  { path: "completedBy", select: "name" },
  { path: "finance.recordedBy", select: "name" },
  { path: "history.by", select: "name" },
];

function mergeItems(items: CreateOrderDto["items"]) {
  const quantities = new Map<string, number>();
  for (const item of items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }
  return [...quantities.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

function orderSequenceKey(date: Date) {
  return `order:${formatDatePart(date)}`;
}

function formatOrderNumber(date: Date, sequence: number) {
  return `ORD-${formatDatePart(date)}-${String(sequence).padStart(4, "0")}`;
}

function formatDatePart(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function asRef(value: Types.ObjectId | RefLike): { id: string; name: string; requireBarcode?: boolean } {
  if (value instanceof Types.ObjectId) {
    return { id: String(value), name: "" };
  }

  const ref = value as RefLike;
  return {
    id: String(ref.id ?? ref._id ?? value),
    name: ref.name ?? "",
    requireBarcode: ref.requireBarcode,
  };
}

function labelStatus(status: OrderStatus) {
  switch (status) {
    case OrderStatus.PENDING_PICKUP:
      return "Menunggu Diambil";
    case OrderStatus.DONE_PICKUP:
      return "Sudah Diambil";
    case OrderStatus.COMPLETED:
      return "Selesai";
  }
}
