import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { hasPermission } from "../auth/role-permissions";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { PERMISSIONS_KEY, PermissionRule } from "../decorators/permissions.decorator";
import { AuthenticatedUser } from "../interfaces/authenticated-user";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<PermissionRule>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.permissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("Akses ditolak");
    }

    const checks = required.permissions.map((permission) => hasPermission(user.role, permission));
    const allowed = required.mode === "any" ? checks.some(Boolean) : checks.every(Boolean);
    if (!allowed) {
      throw new ForbiddenException("Peran Anda tidak memiliki akses ke tindakan ini");
    }

    return true;
  }
}
