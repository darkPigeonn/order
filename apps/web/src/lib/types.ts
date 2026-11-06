export type Role = "SUPER_ADMIN" | "ADMIN" | "SUB_ADMIN" | "USER";

export type OrderStatus = "PENDING_PICKUP" | "DONE_PICKUP" | "COMPLETED";

export type PickupMethod = "SELF_PICK_UP";

export type Permission =
  | "STORE_READ"
  | "STORE_WRITE"
  | "PRODUCT_READ"
  | "PRODUCT_WRITE"
  | "STOCK_READ"
  | "STOCK_WRITE"
  | "ORDER_CREATE"
  | "ORDER_READ_OWN"
  | "ORDER_READ_ALL"
  | "ORDER_PICKUP"
  | "ORDER_FINANCE"
  | "ORDER_COMPLETE"
  | "USER_READ"
  | "USER_WRITE";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResult {
  accessToken: string;
  user: SessionUser;
  permissions: Permission[];
}

export interface MeResult {
  user: SessionUser;
  permissions: Permission[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  orderId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  requireBarcode: boolean;
  notes: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  isActive: boolean;
}

export interface StockLine {
  storeId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  isActive: boolean;
}

export interface Account {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface NamedRef {
  id: string;
  name: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerOrderNumber: string;
  recipientName: string;
  pickupMethod: PickupMethod;
  traderName: string;
  orderAmount: number | null;
  status: OrderStatus;
  note: string;
  createdAt: string;
  updatedAt: string;
  store: NamedRef & { requireBarcode: boolean };
  createdBy: NamedRef;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
  }>;
  barcodes: Array<{
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  }>;
  finance: null | {
    fee: number;
    sellingPrice: number;
    note: string;
    recordedAt: string;
    recordedBy: NamedRef;
  };
  pickedUpAt: string | null;
  pickedUpBy: NamedRef | null;
  completedAt: string | null;
  completedBy: NamedRef | null;
  history: Array<{
    status: OrderStatus;
    at: string;
    note: string;
    by: NamedRef;
  }>;
}

export interface OrderSummary {
  counts: Record<OrderStatus, number>;
  recent: OrderRecord[];
  finance?: {
    totalFee: number;
    totalSellingPrice: number;
    recordedCount: number;
  };
}
