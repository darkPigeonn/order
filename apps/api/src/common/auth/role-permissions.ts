import { Permission } from "../enums/permission.enum";
import { Role } from "../enums/role.enum";

const ALL_PERMISSIONS = Object.values(Permission);

const MANAGER_PERMISSIONS = ALL_PERMISSIONS.filter(
  (permission) => permission !== Permission.ORDER_CREATE,
);

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [Role.SUPER_ADMIN]: MANAGER_PERMISSIONS,
  [Role.ADMIN]: MANAGER_PERMISSIONS,
  [Role.SUB_ADMIN]: [
    Permission.STORE_READ,
    Permission.PRODUCT_READ,
    Permission.STOCK_READ,
    Permission.ORDER_READ_ALL,
    Permission.ORDER_PICKUP,
  ],
  [Role.USER]: [
    Permission.STORE_READ,
    Permission.PRODUCT_READ,
    Permission.STOCK_READ,
    Permission.ORDER_CREATE,
    Permission.ORDER_READ_OWN,
  ],
};

export function permissionsFor(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return permissionsFor(role).includes(permission);
}
