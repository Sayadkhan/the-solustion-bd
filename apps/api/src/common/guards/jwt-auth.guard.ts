import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import jwt from "jsonwebtoken";
import { ENV } from "../../config/env";
import { AuthUserPayload } from "../../middlewares/authMiddleware";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    let token: string | undefined;

    // 1. Check Authorization Bearer header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // 2. Fallback to HTTP-Only Cookie
    if (!token && request.cookies?.access_token) {
      token = request.cookies.access_token;
    }

    if (!token) {
      throw new UnauthorizedException("Authentication required. Please log in.");
    }

    try {
      const decoded = jwt.verify(token, ENV.JWT.ACCESS_SECRET) as AuthUserPayload;
      request.user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException("Session expired or invalid token. Please log in again.");
    }
  }
}
