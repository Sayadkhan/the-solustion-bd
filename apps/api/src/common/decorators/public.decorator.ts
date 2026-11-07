import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/**
 * Every route requires a valid session unless it is explicitly marked public.
 * A public route still receives `request.user` when a valid token is present.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
