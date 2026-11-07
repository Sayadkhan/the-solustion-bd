import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthUserPayload } from "../types/auth-user";

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthUserPayload | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user || null;
  }
);
