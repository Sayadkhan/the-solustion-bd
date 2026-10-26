import dotenv from "dotenv";
import path from "path";

// Load root .env or app .env
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.API_PORT || process.env.PORT || "4000", 10),
  TZ: process.env.TZ || "Asia/Dhaka",
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/the_solusation_bd?schema=public",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  TYPESENSE: {
    HOST: process.env.TYPESENSE_HOST || "localhost",
    PORT: parseInt(process.env.TYPESENSE_PORT || "8108", 10),
    PROTOCOL: process.env.TYPESENSE_PROTOCOL || "http",
    API_KEY: process.env.TYPESENSE_API_KEY || "solusation_dev_typesense_key_2026",
  },
  JWT: {
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "solusation_access_secret_2026",
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "solusation_refresh_secret_2026",
  },
  SMTP: {
    HOST: process.env.SMTP_HOST || "smtp.gmail.com",
    PORT: parseInt(process.env.SMTP_PORT || "587", 10),
    USER: process.env.SMTP_USER || "info@thesolusationbd.com",
    PASS: process.env.SMTP_PASS || "",
    FROM: process.env.SMTP_FROM || "The Solusation BD <info@thesolusationbd.com>",
    ADMIN_EMAIL: process.env.ADMIN_NOTIFY_EMAIL || "support@thesolusationbd.com",
  },
  CORS_ORIGINS: [
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.NEXT_PUBLIC_STOREFRONT_URL || "",
    process.env.NEXT_PUBLIC_ADMIN_URL || "",
  ].filter(Boolean),
};
