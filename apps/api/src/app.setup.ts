import path from "path";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ENV } from "./config/env";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

/** All HTTP-level configuration, shared by the server and the integration tests. */
export function configureApp(app: NestExpressApplication) {
  // Nginx is the single trusted hop; rate limiting relies on the real client IP.
  if (ENV.IS_PRODUCTION) {
    app.set("trust proxy", 1);
  }

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cookieParser());
  app.use(morgan(ENV.IS_PRODUCTION ? "combined" : "dev"));

  // Uploads may include SVG, so nothing served from here may run scripts.
  app.use(
    "/uploads",
    express.static(path.join(process.cwd(), "uploads"), {
      setHeaders: (res) => {
        res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
        res.setHeader("X-Content-Type-Options", "nosniff");
      },
    })
  );

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Requests without an Origin header are not cross-site browser requests.
      callback(null, !origin || ENV.CORS_ORIGINS.includes(origin));
    },
    credentials: true,
  });

  app.setGlobalPrefix("api/v1");
  app.useGlobalFilters(new AllExceptionsFilter());

  if (ENV.ENABLE_SWAGGER) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("The Solutions BD - Backend API")
      .setDescription(
        "NestJS e-commerce API for the Bangladesh tech platform: dual pricing, PSU headroom, and outside-Dhaka COD rules."
      )
      .setVersion("1.0.0")
      .addBearerAuth()
      .build();

    SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, swaggerConfig));
  }
}
