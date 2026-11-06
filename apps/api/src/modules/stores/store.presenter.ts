import { StoreDocument } from "./schemas/store.schema";

export interface StoreResponse {
  id: string;
  name: string;
  address: string;
  phone: string;
  requireBarcode: boolean;
  notes: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toStoreResponse(store: StoreDocument): StoreResponse {
  return {
    id: store.id,
    name: store.name,
    address: store.address,
    phone: store.phone,
    requireBarcode: store.requireBarcode,
    notes: store.notes,
    isActive: store.isActive,
    createdAt: store.createdAt,
    updatedAt: store.updatedAt,
  };
}
