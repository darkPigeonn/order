import { SetMetadata } from "@nestjs/common";
import { Permission } from "../enums/permission.enum";

export const PERMISSIONS_KEY = "permissions";

export interface PermissionRule {
  mode: "all" | "any";
  permissions: Permission[];
}

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, { mode: "all", permissions } satisfies PermissionRule);

export const RequireAnyPermission = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, { mode: "any", permissions } satisfies PermissionRule);
