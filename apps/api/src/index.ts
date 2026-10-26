import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { pool } from "@solusation/database";
import { ENV } from "./config/env";
import apiRoutes from "./routes/api.routes";
import { errorHandler } from "./middlewares/errorHandler";
import { productSyncService } from "./services/productSyncService";

const app = express();

// Security & Parsing Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin || ENV.CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly permissive CORS
    },
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Mount API routes
app.use("/api/v1", apiRoutes);

// Root fallback
app.get("/", (req, res) => {
  res.json({
    message: "The Solusation BD - High-Performance E-Commerce Backend API (PostgreSQL + Drizzle ORM)",
    version: "1.0.0",
    docs: "/api/v1/health",
  });
});

// Centralized Error Handling
app.use(errorHandler);

const PORT = ENV.PORT || 4000;

async function bootstrap() {
  try {
    // Non-blocking ping to PostgreSQL
    pool.query("SELECT 1").catch((err) => {
      console.warn(
        `[Database] Note: PostgreSQL connection failed on ${ENV.DATABASE_URL.replace(/:[^:]*@/, ":***@")} (${err.message}). API will run in mock/degraded mode until Docker containers are running.`
      );
    });

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 The Solusation BD API server running on port ${PORT}`);
      console.log(`📍 Endpoint: http://localhost:${PORT}/api/v1`);
      console.log(`🐘 Database: PostgreSQL (Drizzle ORM + pg pool)`);
      console.log(`🕒 Timezone: ${ENV.TZ}`);
      console.log(`====================================================`);

      // Initialize Typesense collection & sync products in background
      productSyncService
        .syncAllProducts()
        .then((res) => {
          if (res.success && res.count > 0) {
            console.log(`[TYPESENSE] Startup sync complete: ${res.count} products indexed.`);
          }
        })
        .catch((err) => {
          console.warn(`[TYPESENSE] Startup sync note: ${err.message}`);
        });
    });

    // Graceful Shutdown
    const shutdown = async () => {
      console.log("\n[API] Shutting down gracefully...");
      await pool.end();
      server.close(() => {
        console.log("[API] HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to start API server:", error);
    process.exit(1);
  }
}

bootstrap();
