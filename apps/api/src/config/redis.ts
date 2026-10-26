import Redis from "ioredis";
import { ENV } from "./env";

export const redis = new Redis(ENV.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) {
      console.warn("[Redis] Exceeded max retries. Operating in degraded cache-bypass mode.");
      return null;
    }
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
});

redis.on("connect", () => {
  console.log("[Redis] Connected to Redis server successfully.");
});

redis.on("error", (err) => {
  // Gracefully handle if redis is not running yet during dev setup
  console.warn("[Redis] Redis error or not running yet:", err.message);
});
