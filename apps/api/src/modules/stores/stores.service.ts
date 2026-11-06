import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, FilterQuery, Model, Types } from "mongoose";
import { buildPageMeta, Paginated } from "../../common/interfaces/paginated";
import { escapeRegex, resolveSort } from "../../common/utils/sort-query";
import { CreateStoreDto } from "./dto/create-store.dto";
import { ListStoresQuery } from "./dto/list-stores.query";
import { UpdateStoreDto } from "./dto/update-store.dto";
import { Store, StoreDocument } from "./schemas/store.schema";
import { StoreResponse, toStoreResponse } from "./store.presenter";

@Injectable()
export class StoresService {
  constructor(
    @InjectModel(Store.name) private readonly storeModel: Model<Store>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(dto: CreateStoreDto): Promise<StoreResponse> {
    const store = await this.storeModel.create({
      name: dto.name.trim(),
      address: dto.address?.trim() ?? "",
      phone: dto.phone?.trim() ?? "",
      requireBarcode: dto.requireBarcode,
      notes: dto.notes?.trim() ?? "",
      isActive: dto.isActive ?? true,
    });
    return toStoreResponse(store);
  }

  async list(query: ListStoresQuery): Promise<Paginated<StoreResponse>> {
    const filter: FilterQuery<Store> = {};
    if (query.activeOnly || query.active === "active") filter.isActive = true;
    if (query.active === "inactive") filter.isActive = false;
    if (query.barcode === "required") filter.requireBarcode = true;
    if (query.barcode === "optional") filter.requireBarcode = false;
    if (query.q) {
      const pattern = new RegExp(escapeRegex(query.q.trim()), "i");
      filter.$or = [{ name: pattern }, { address: pattern }, { phone: pattern }];
    }

    const [total, rows] = await Promise.all([
      this.storeModel.countDocuments(filter),
      this.storeModel
        .find(filter)
        .sort(resolveSort(query.sortBy, query.sortDir, ["name", "phone", "createdAt"], { field: "name", direction: 1 }))
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
    ]);

    return {
      data: rows.map((row) => toStoreResponse(row)),
      meta: buildPageMeta(query.page, query.limit, total),
    };
  }

  async findById(id: string): Promise<StoreResponse> {
    const store = await this.requireDocument(id);
    return toStoreResponse(store);
  }

  async update(id: string, dto: UpdateStoreDto): Promise<StoreResponse> {
    const store = await this.requireDocument(id);
    if (dto.name !== undefined) store.name = dto.name.trim();
    if (dto.address !== undefined) store.address = dto.address.trim();
    if (dto.phone !== undefined) store.phone = dto.phone.trim();
    if (dto.requireBarcode !== undefined) store.requireBarcode = dto.requireBarcode;
    if (dto.notes !== undefined) store.notes = dto.notes.trim();
    if (dto.isActive !== undefined) store.isActive = dto.isActive;
    await store.save();
    return toStoreResponse(store);
  }

  async remove(id: string) {
    const store = await this.requireDocument(id);
    const storeId = new Types.ObjectId(store.id);
    const used = await this.connection.collection("orders").countDocuments({ storeId });
    if (used > 0) {
      throw new ConflictException("Toko masih tercatat pada pesanan dan tidak dapat dihapus. Nonaktifkan toko bila tidak dipakai lagi.");
    }
    await this.connection.collection("stocks").deleteMany({ storeId });
    await store.deleteOne();
    return { deleted: true };
  }

  async requireActive(id: string): Promise<StoreDocument> {
    const store = await this.storeModel.findById(id);
    if (!store || !store.isActive) {
      throw new NotFoundException("Toko tidak ditemukan atau tidak aktif");
    }
    return store;
  }

  private async requireDocument(id: string): Promise<StoreDocument> {
    const store = await this.storeModel.findById(id);
    if (!store) {
      throw new NotFoundException("Toko tidak ditemukan");
    }
    return store;
  }
}

