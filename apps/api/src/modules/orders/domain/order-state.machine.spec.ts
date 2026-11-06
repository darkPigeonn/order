import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OrderStatus } from "../../../common/enums/order-status.enum";
import { canTransition } from "./order-state.machine";

describe("alur status pesanan", () => {
  it("mengikuti tiga tahap pada spesifikasi", () => {
    assert.equal(canTransition(OrderStatus.PENDING_PICKUP, OrderStatus.DONE_PICKUP), true);
    assert.equal(canTransition(OrderStatus.DONE_PICKUP, OrderStatus.COMPLETED), true);
  });

  it("menolak lompatan dan pembalikan status", () => {
    assert.equal(canTransition(OrderStatus.PENDING_PICKUP, OrderStatus.COMPLETED), false);
    assert.equal(canTransition(OrderStatus.DONE_PICKUP, OrderStatus.PENDING_PICKUP), false);
    assert.equal(canTransition(OrderStatus.COMPLETED, OrderStatus.DONE_PICKUP), false);
  });
});
