import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthUserPayload } from "../../middlewares/authMiddleware";

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthUserPayload | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user || null;
  }
);
