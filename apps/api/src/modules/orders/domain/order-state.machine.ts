import { OrderStatus } from "../../../common/enums/order-status.enum";

export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.PENDING_PICKUP]: [OrderStatus.DONE_PICKUP],
  [OrderStatus.DONE_PICKUP]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}
