import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import path from "path";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import { AppModule } from "./app.module";
import { ENV } from "./config/env";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Middlewares
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cookieParser());
  app.use(morgan("dev"));

  // Serve uploaded images statically
  const uploadDir = path.join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadDir));

  // CORS
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || ENV.CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly permissive CORS
    },
    credentials: true,
  });

  // Global API Prefix
  app.setGlobalPrefix("api/v1");

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle("The Solusation BD - Backend API")
    .setDescription(
      "High-Performance NestJS E-Commerce API for Bangladesh Tech Platform with Dual Pricing, Rule 4.3 PSU Headroom, and Rule 4.5 Outside-Dhaka COD logic."
    )
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  const PORT = ENV.PORT || 4000;
  await app.listen(PORT);

  console.log(`====================================================`);
  console.log(`🚀 The Solusation BD NestJS API server running!`);
  console.log(`📍 Base API: http://localhost:${PORT}/api/v1`);
  console.log(`📚 Swagger Docs: http://localhost:${PORT}/api/docs`);
  console.log(`🐘 Database: PostgreSQL (Drizzle ORM)`);
  console.log(`🕒 Timezone: ${ENV.TZ}`);
  console.log(`====================================================`);
}

bootstrap().catch((err) => {
  console.error("[NESTJS BOOTSTRAP ERROR]:", err);
  process.exit(1);
});
