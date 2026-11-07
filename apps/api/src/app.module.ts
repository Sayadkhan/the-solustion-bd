import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { DatabaseModule } from "./modules/database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ProductsModule } from "./modules/products/products.module";
import { SearchModule } from "./modules/search/search.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PcBuilderModule } from "./modules/pc-builder/pc-builder.module";
import { SerialsModule } from "./modules/serials/serials.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { HealthModule } from "./modules/health/health.module";
import { UploadModule } from "./modules/upload/upload.module";
import { BlogModule } from "./modules/blog/blog.module";
import { BannersModule } from "./modules/banners/banners.module";
import { BkashModule } from "./modules/bkash/bkash.module";
import { RateLimitGuard } from "./common/guards/rate-limit.guard";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ProductsModule,
    SearchModule,
    OrdersModule,
    PcBuilderModule,
    SerialsModule,
    SettingsModule,
    HealthModule,
    UploadModule,
    BlogModule,
    BannersModule,
    BkashModule,
  ],
  providers: [
    // Runs in this order. Routes are closed by default; see @Public() and @Roles().
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
