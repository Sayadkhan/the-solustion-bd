import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RATE_LIMIT_KEY, RateLimitOptions } from "../decorators/rate-limit.decorator";

interface Bucket {
  count: number;
  resetAt: number;
}

const MAX_TRACKED_BUCKETS = 50_000;

/**
 * Per-IP, per-route fixed-window limiter. Counters live in this process, which
 * matches the single-instance PM2 deployment. Moving to several instances
 * requires a shared store such as Redis.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      context.getHandler()
    );
    if (!options) return true;

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const now = Date.now();
    const key = `${context.getClass().name}.${context.getHandler().name}:${request.ip}`;

    this.pruneIfNeeded(now);

    let bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + options.windowSeconds * 1000 };
      this.buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count > options.limit) {
      response.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000));
      throw new HttpException(
        "Too many attempts. Please wait a while and try again.",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }

  private pruneIfNeeded(now: number) {
    if (this.buckets.size < MAX_TRACKED_BUCKETS) return;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
    // Everything still active: drop the oldest entries rather than grow without limit.
    if (this.buckets.size >= MAX_TRACKED_BUCKETS) {
      const excess = this.buckets.size - MAX_TRACKED_BUCKETS + 1;
      let removed = 0;
      for (const key of this.buckets.keys()) {
        if (removed++ >= excess) break;
        this.buckets.delete(key);
      }
    }
  }
}
