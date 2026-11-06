import { ProductDocument } from "./schemas/product.schema";

export interface ProductResponse {
  id: string;
  name: string;
  sku: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toProductResponse(product: ProductDocument): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
