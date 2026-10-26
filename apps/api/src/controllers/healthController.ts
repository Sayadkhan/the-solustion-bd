import { Request, Response } from "express";
import { pool } from "@solusation/database";
import { redis } from "../config/redis";
import { checkTypesenseHealth } from "../config/typesense";

export const getHealthStatus = async (req: Request, res: Response): Promise<void> => {
  let dbStatus = "DISCONNECTED";
  try {
    // Fast raw ping query in PostgreSQL via pg Pool
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

  res.json({
    status: "ok",
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
  });
};
