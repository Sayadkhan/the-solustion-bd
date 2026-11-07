import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import jwt from "jsonwebtoken";
import { ENV } from "../../config/env";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import type { AuthUserPayload } from "../types/auth-user";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      if (isPublic) return true;
      throw new UnauthorizedException("Authentication required. Please log in.");
    }

    try {
      request.user = jwt.verify(token, ENV.JWT.ACCESS_SECRET, {
        algorithms: ["HS256"],
      }) as AuthUserPayload;
      return true;
    } catch {
      // An expired cookie must not block a public page such as the storefront.
      if (isPublic) return true;
      throw new UnauthorizedException("Session expired or invalid token. Please log in again.");
    }
  }

  private extractToken(request: any): string | undefined {
    const authHeader: string | undefined = request.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.split(" ")[1];
    }
    return request.cookies?.access_token;
  }
}
