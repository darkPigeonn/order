import { OrderStatus, PickupMethod, Role } from "./types";

export function formatNominal(value: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
}

export function parseNominal(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function rupiah(value: number) {
  return `Rp ${formatNominal(value)}`;
}

export function tanggal(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function statusLabel(status: OrderStatus) {
  switch (status) {
    case "PENDING_PICKUP":
      return "Menunggu Diambil";
    case "DONE_PICKUP":
      return "Sudah Diambil";
    case "COMPLETED":
      return "Selesai";
  }
}

export function pickupLabel(method: PickupMethod) {
  switch (method) {
    case "SELF_PICK_UP":
      return "Self Pick Up";
  }
}

export function roleLabel(role: Role) {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "ADMIN":
      return "Admin";
    case "SUB_ADMIN":
      return "Sub Admin";
    case "USER":
      return "User";
  }
}
