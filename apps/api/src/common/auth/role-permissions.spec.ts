import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Permission } from "../enums/permission.enum";
import { Role } from "../enums/role.enum";
import { hasPermission } from "./role-permissions";

describe("hak akses peran", () => {
  it("menyembunyikan finansial dari sub admin dan user", () => {
    assert.equal(hasPermission(Role.SUB_ADMIN, Permission.ORDER_FINANCE), false);
    assert.equal(hasPermission(Role.USER, Permission.ORDER_FINANCE), false);
    assert.equal(hasPermission(Role.ADMIN, Permission.ORDER_FINANCE), true);
    assert.equal(hasPermission(Role.SUPER_ADMIN, Permission.ORDER_FINANCE), true);
  });

  it("hanya user yang membuat order", () => {
    assert.equal(hasPermission(Role.USER, Permission.ORDER_CREATE), true);
    assert.equal(hasPermission(Role.ADMIN, Permission.ORDER_CREATE), false);
    assert.equal(hasPermission(Role.SUB_ADMIN, Permission.ORDER_CREATE), false);
    assert.equal(hasPermission(Role.SUPER_ADMIN, Permission.ORDER_CREATE), false);
  });

  it("sub admin boleh pickup tetapi tidak menyelesaikan order", () => {
    assert.equal(hasPermission(Role.SUB_ADMIN, Permission.ORDER_PICKUP), true);
    assert.equal(hasPermission(Role.SUB_ADMIN, Permission.ORDER_COMPLETE), false);
  });
});
