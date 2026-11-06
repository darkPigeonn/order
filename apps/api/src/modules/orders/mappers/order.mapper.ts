import { hasPermission } from "../../../common/auth/role-permissions";
import { OrderStatus } from "../../../common/enums/order-status.enum";
import { PickupMethod } from "../../../common/enums/pickup-method.enum";
import { Permission } from "../../../common/enums/permission.enum";
import { Role } from "../../../common/enums/role.enum";

export interface NamedRef {
  id: string;
  name: string;
}

export interface OrderFinanceView {
  fee: number;
  sellingPrice: number;
  note: string;
  recordedAt: Date;
  recordedBy: NamedRef;
}

export interface OrderViewSource {
  id: string;
  orderNumber: string;
  customerOrderNumber: string;
  recipientName: string;
  pickupMethod: PickupMethod;
  traderName: string;
  orderAmount: number | null;
  status: OrderStatus;
  note: string;
  createdAt: Date;
  updatedAt: Date;
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
  finance: OrderFinanceView | null;
  pickedUpAt: Date | null;
  pickedUpBy: NamedRef | null;
  completedAt: Date | null;
  completedBy: NamedRef | null;
  history: Array<{
    status: OrderStatus;
    at: Date;
    note: string;
    by: NamedRef;
  }>;
}

export function toOrderResponse(source: OrderViewSource, viewerRole: Role) {
  const canSeeFinance = hasPermission(viewerRole, Permission.ORDER_FINANCE);
  return {
    ...source,
    finance: canSeeFinance ? source.finance : null,
  };
}
