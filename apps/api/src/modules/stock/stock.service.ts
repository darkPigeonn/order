import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { buildPageMeta, Paginated } from "../../common/interfaces/paginated";
import { ProductsService } from "../products/products.service";
import { StoresService } from "../stores/stores.service";
import { ListStockQuery } from "./dto/list-stock.query";
import { UpsertStockDto } from "./dto/upsert-stock.dto";
import { Stock } from "./schemas/stock.schema";

export interface StockLine {
  storeId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  isActive: boolean;
}

export interface StockReservationItem {
  productId: string;
  productName: string;
  quantity: number;
}

@Injectable()
export class StockService {
  constructor(
    @InjectModel(Stock.name) private readonly stockModel: Model<Stock>,
    private readonly storesService: StoresService,
    private readonly productsService: ProductsService,
  ) {}

  async listByStore(query: ListStockQuery): Promise<Paginated<StockLine>> {
    await this.storesService.findById(query.storeId);
    const products = await this.productsService.findAll();
    const stocks = await this.stockModel.find({ storeId: query.storeId });
    const quantityByProduct = new Map(stocks.map((row) => [String(row.productId), row.quantity]));
    const keyword = query.q?.trim().toLowerCase();

    let lines = products.map((product) => ({
      storeId: query.storeId,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: quantityByProduct.get(product.id) ?? 0,
      isActive: product.isActive,
    }));

    if (query.active === "active") lines = lines.filter((line) => line.isActive);
    if (query.active === "inactive") lines = lines.filter((line) => !line.isActive);
    if (keyword) {
      lines = lines.filter((line) =>
        line.productName.toLowerCase().includes(keyword) || line.sku.toLowerCase().includes(keyword),
      );
    }

    const sortField = ["productName", "sku", "quantity"].includes(query.sortBy ?? "")
      ? (query.sortBy as "productName" | "sku" | "quantity")
      : "productName";
    const direction = query.sortBy && query.sortDir === "desc" ? -1 : 1;
    lines.sort((left, right) => {
      const leftValue = left[sortField];
      const rightValue = right[sortField];
      if (leftValue < rightValue) return -1 * direction;
      if (leftValue > rightValue) return 1 * direction;
      return 0;
    });

    const start = (query.page - 1) * query.limit;
    return {
      data: lines.slice(start, start + query.limit),
      meta: buildPageMeta(query.page, query.limit, lines.length),
    };
  }

  async upsert(dto: UpsertStockDto): Promise<StockLine> {
    await this.storesService.findById(dto.storeId);
    const product = await this.productsService.findById(dto.productId);
    if (!product.isActive) {
      throw new BadRequestException("Produk tidak aktif sehingga stok tidak dapat diubah");
    }

    await this.stockModel.findOneAndUpdate(
      { storeId: dto.storeId, productId: dto.productId },
      { $set: { quantity: dto.quantity } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return {
      storeId: dto.storeId,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: dto.quantity,
      isActive: product.isActive,
    };
  }

  async reserve(storeId: string, items: StockReservationItem[]): Promise<void> {
    const reserved: StockReservationItem[] = [];

    try {
      for (const item of items) {
        const updated = await this.stockModel.findOneAndUpdate(
          {
            storeId,
            productId: item.productId,
            quantity: { $gte: item.quantity },
          },
          { $inc: { quantity: -item.quantity } },
        );

        if (!updated) {
          throw new BadRequestException(`Stok ${item.productName} di toko ini tidak mencukupi`);
        }

        reserved.push(item);
      }
    } catch (error) {
      await this.release(storeId, reserved);
      throw error;
    }
  }

  async release(storeId: string, items: StockReservationItem[]): Promise<void> {
    await Promise.all(
      items.map((item) =>
        this.stockModel.updateOne(
          {
            storeId,
            productId: item.productId,
          },
          { $inc: { quantity: item.quantity } },
        ),
      ),
    );
  }
}
