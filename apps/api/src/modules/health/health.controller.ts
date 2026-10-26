import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { pool } from "@solusation/database";
import { redis } from "../../config/redis";
import { checkTypesenseHealth } from "../../config/typesense";

@ApiTags("Health")
@Controller()
export class HealthController {
  @ApiOperation({ summary: "Service health check and database connectivity" })
  @Get("health")
  async getHealth() {
    let dbStatus = "DISCONNECTED";
    try {
      await pool.query("SELECT 1");
      dbStatus = "CONNECTED";
    } catch {
      dbStatus = "DISCONNECTED";
    }

    let redisStatus = "DISCONNECTED";
    try {
      const ping = await redis.ping();
      if (ping === "PONG") redisStatus = "CONNECTED";
    } catch {
      redisStatus = "DISCONNECTED";
    }

    const typesenseOk = await checkTypesenseHealth();

    return {
      status: "ok",
      framework: "NestJS (Enterprise Modular Architecture)",
      service: "@solusation/api",
      version: "1.0.0",
      timezone: process.env.TZ || "Asia/Dhaka",
      currentTime: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      infrastructure: {
        postgresql: dbStatus,
        redis: redisStatus,
        typesense: typesenseOk ? "CONNECTED" : "UNAVAILABLE",
      },
    };
  }
}
