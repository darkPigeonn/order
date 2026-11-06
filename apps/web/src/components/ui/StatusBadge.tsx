import { statusLabel } from "@/lib/format";
import { OrderStatus } from "@/lib/types";

const styles: Record<OrderStatus, string> = {
  PENDING_PICKUP: "bg-[#e8eefc] text-[#1e40af]",
  DONE_PICKUP: "bg-[#fde8ee] text-[#9f1239]",
  COMPLETED: "bg-[#e8eef5] text-[#16325c]",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {statusLabel(status)}
    </span>
  );
}
