import { Permission } from "./types";

export function can(permissions: readonly string[], permission: Permission) {
  return permissions.includes(permission);
}

export function canAny(permissions: readonly string[], required: Permission[]) {
  return required.some((permission) => permissions.includes(permission));
}
