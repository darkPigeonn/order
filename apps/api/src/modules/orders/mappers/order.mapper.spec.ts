import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OrderStatus } from "../../../common/enums/order-status.enum";
import { PickupMethod } from "../../../common/enums/pickup-method.enum";
import { Role } from "../../../common/enums/role.enum";
import { OrderViewSource, toOrderResponse } from "./order.mapper";

const source: OrderViewSource = {
  id: "order-1",
  orderNumber: "ORD-20261106-0001",
  customerOrderNumber: "TRK-1001",
  recipientName: "Budi",
  pickupMethod: PickupMethod.SELF_PICK_UP,
  traderName: "Yohanes iCase",
  orderAmount: 1500000,
  status: OrderStatus.DONE_PICKUP,
  note: "",
  createdAt: new Date("2026-11-06T00:00:00.000Z"),
  updatedAt: new Date("2026-11-06T00:00:00.000Z"),
  store: { id: "store-1", name: "Studio Ponsel", requireBarcode: true },
  createdBy: { id: "user-1", name: "Mitra" },
  items: [{ productId: "product-1", productName: "Casing", sku: "CAS-001", quantity: 1 }],
  barcodes: [],
  finance: {
    fee: 15000,
    sellingPrice: 125000,
    note: "",
    recordedAt: new Date("2026-11-06T00:00:00.000Z"),
    recordedBy: { id: "admin-1", name: "Admin" },
  },
  pickedUpAt: null,
  pickedUpBy: null,
  completedAt: null,
  completedBy: null,
  history: [],
};

describe("penyembunyian data finansial", () => {
  it("mengosongkan fee dan harga jual untuk sub admin serta user", () => {
    assert.equal(toOrderResponse(source, Role.SUB_ADMIN).finance, null);
    assert.equal(toOrderResponse(source, Role.USER).finance, null);
  });

  it("menampilkan fee dan harga jual untuk admin", () => {
    assert.equal(toOrderResponse(source, Role.ADMIN).finance?.fee, 15000);
    assert.equal(toOrderResponse(source, Role.SUPER_ADMIN).finance?.sellingPrice, 125000);
  });
});
