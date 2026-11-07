import dotenv from "dotenv";
import path from "path";

// Load root .env or app .env
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

const DEV_ONLY_ACCESS_SECRET = "dev_only_access_secret_not_for_production";
const DEV_ONLY_REFRESH_SECRET = "dev_only_refresh_secret_not_for_production";
const PLACEHOLDER_SECRET_MARKERS = ["your_super_secret", "change_in_production", "dev_only_"];

function parseList(value: string | undefined): string[] {
  return (value || "")
    .split(",")
    .map((item) => item.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

/** Refuses to boot production with a missing, placeholder, or reused signing secret. */
function assertProductionSecrets() {
  const access = process.env.JWT_ACCESS_SECRET || "";
  const refresh = process.env.JWT_REFRESH_SECRET || "";
  const problems: string[] = [];

  for (const [name, value] of [
    ["JWT_ACCESS_SECRET", access],
    ["JWT_REFRESH_SECRET", refresh],
  ] as const) {
    if (value.length < 32) {
      problems.push(`${name} must be set and at least 32 characters long`);
    } else if (PLACEHOLDER_SECRET_MARKERS.some((marker) => value.includes(marker))) {
      problems.push(`${name} still contains a placeholder value`);
    }
  }
  if (access && access === refresh) {
    problems.push("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different");
  }
  if (!process.env.DATABASE_URL) {
    problems.push("DATABASE_URL must be set");
  }

  if (problems.length > 0) {
    throw new Error(`Unsafe production configuration:\n - ${problems.join("\n - ")}`);
  }
}

if (isProduction) {
  assertProductionSecrets();
}

const STOREFRONT_URL = (process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3000").replace(/\/$/, "");
const ADMIN_URL = (process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001").replace(/\/$/, "");

export const ENV = {
  NODE_ENV,
  IS_PRODUCTION: isProduction,
  PORT: parseInt(process.env.API_PORT || process.env.PORT || "4000", 10),
  /** Set to 127.0.0.1 in production so that only the reverse proxy can reach the API. */
  BIND_HOST: process.env.API_BIND_HOST || "0.0.0.0",
  TZ: process.env.TZ || "Asia/Dhaka",
  STOREFRONT_URL,
  ADMIN_URL,
  /** Secure cookies need HTTPS. Only override this while a site is still served over plain HTTP. */
  COOKIE_SECURE: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : isProduction,
  ENABLE_SWAGGER: process.env.ENABLE_SWAGGER ? process.env.ENABLE_SWAGGER === "true" : !isProduction,
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
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || DEV_ONLY_ACCESS_SECRET,
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || DEV_ONLY_REFRESH_SECRET,
  },
  SMTP: {
    HOST: process.env.SMTP_HOST || "smtp.gmail.com",
    PORT: parseInt(process.env.SMTP_PORT || "587", 10),
    USER: process.env.SMTP_USER || "",
    PASS: process.env.SMTP_PASS || "",
    FROM: process.env.SMTP_FROM || "The Solutions BD <thesolutionsbd@gmail.com>",
    ADMIN_EMAIL: process.env.ADMIN_NOTIFY_EMAIL || "thesolutionsbd@gmail.com",
  },
  BKASH: {
    APP_KEY: process.env.BKASH_APP_KEY || "",
    APP_SECRET: process.env.BKASH_APP_SECRET || "",
    USERNAME: process.env.BKASH_USERNAME || "",
    PASSWORD: process.env.BKASH_PASSWORD || "",
    BASE_URL: (process.env.BKASH_BASE_URL || "https://tokenized.sandbox.bka.sh/v1.2.0-beta").replace(/\/$/, ""),
    MERCHANT_NUMBER: process.env.BKASH_MERCHANT_NUMBER || "01922-730343",
  },
  CORS_ORIGINS: Array.from(
    new Set(
      [
        ...parseList(process.env.CORS_ORIGINS),
        STOREFRONT_URL,
        ADMIN_URL,
        ...(isProduction ? [] : ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]),
      ].filter(Boolean)
    )
  ),
};
