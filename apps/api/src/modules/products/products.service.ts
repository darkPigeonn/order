import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, FilterQuery, Model, Types } from "mongoose";
import { buildPageMeta, Paginated } from "../../common/interfaces/paginated";
import { escapeRegex, resolveSort } from "../../common/utils/sort-query";
import { CreateProductDto } from "./dto/create-product.dto";
import { ListProductsQuery } from "./dto/list-products.query";
import { UpdateProductDto } from "./dto/update-product.dto";
import { Product, ProductDocument } from "./schemas/product.schema";
import { ProductResponse, toProductResponse } from "./product.presenter";

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(dto: CreateProductDto): Promise<ProductResponse> {
    const sku = dto.sku.trim().toUpperCase();
    const existing = await this.productModel.exists({ sku });
    if (existing) {
      throw new ConflictException("SKU sudah digunakan");
    }

    const product = await this.productModel.create({
      name: dto.name.trim(),
      sku,
      description: dto.description?.trim() ?? "",
      isActive: dto.isActive ?? true,
    });
    return toProductResponse(product);
  }

  async list(query: ListProductsQuery): Promise<Paginated<ProductResponse>> {
    const filter: FilterQuery<Product> = {};
    if (query.activeOnly || query.active === "active") filter.isActive = true;
    if (query.active === "inactive") filter.isActive = false;
    if (query.q) {
      const pattern = new RegExp(escapeRegex(query.q.trim()), "i");
      filter.$or = [{ name: pattern }, { sku: pattern }];
    }

    const [total, rows] = await Promise.all([
      this.productModel.countDocuments(filter),
      this.productModel
        .find(filter)
        .sort(resolveSort(query.sortBy, query.sortDir, ["name", "sku", "createdAt"], { field: "name", direction: 1 }))
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
    ]);

    return {
      data: rows.map((row) => toProductResponse(row)),
      meta: buildPageMeta(query.page, query.limit, total),
    };
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponse> {
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException("Produk tidak ditemukan");
    }

    if (dto.name !== undefined) product.name = dto.name.trim();
    if (dto.sku !== undefined) {
      const sku = dto.sku.trim().toUpperCase();
      const existing = await this.productModel.exists({ sku, _id: { $ne: product.id } });
      if (existing) throw new ConflictException("SKU sudah digunakan");
      product.sku = sku;
    }
    if (dto.description !== undefined) product.description = dto.description.trim();
    if (dto.isActive !== undefined) product.isActive = dto.isActive;
    await product.save();
    return toProductResponse(product);
  }

  async remove(id: string) {
    const product = await this.findById(id);
    const productId = new Types.ObjectId(product.id);
    const used = await this.connection.collection("orders").countDocuments({ "items.productId": productId });
    if (used > 0) {
      throw new ConflictException("Produk masih tercatat pada pesanan dan tidak dapat dihapus. Nonaktifkan produk bila tidak dipakai lagi.");
    }
    await this.connection.collection("stocks").deleteMany({ productId });
    await product.deleteOne();
    return { deleted: true };
  }

  async findAll(): Promise<ProductDocument[]> {
    return this.productModel.find().sort({ name: 1 });
  }

  async findById(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException("Produk tidak ditemukan");
    }
    return product;
  }

  async findActiveByIds(ids: string[]): Promise<ProductDocument[]> {
    const uniqueIds = [...new Set(ids)];
    const products = await this.productModel.find({ _id: { $in: uniqueIds }, isActive: true });
    if (products.length !== uniqueIds.length) {
      throw new NotFoundException("Sebagian produk tidak ditemukan atau tidak aktif");
    }
    return products;
  }
}

