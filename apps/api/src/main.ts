import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";
import { ENV } from "./config/env";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);

  await app.listen(ENV.PORT, ENV.BIND_HOST);

  console.log(`====================================================`);
  console.log(`🚀 The Solutions BD NestJS API server running!`);
  console.log(`📍 Base API: http://${ENV.BIND_HOST}:${ENV.PORT}/api/v1`);
  if (ENV.ENABLE_SWAGGER) {
    console.log(`📚 Swagger Docs: http://localhost:${ENV.PORT}/api/docs`);
  }
  console.log(`🐘 Database: PostgreSQL (Drizzle ORM)`);
  console.log(`🕒 Timezone: ${ENV.TZ}`);
  console.log(`====================================================`);
}

bootstrap().catch((err) => {
  console.error("[NESTJS BOOTSTRAP ERROR]:", err);
  process.exit(1);
});
