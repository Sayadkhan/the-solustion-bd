import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@solusation/shared-types";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("Access denied. User not authenticated.");
    }

    // SUPER_ADMIN has full bypass
    if (user.role === "SUPER_ADMIN") {
      return true;
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Requires one of the following roles: [${requiredRoles.join(", ")}].`
      );
    }

    return true;
  }
}
