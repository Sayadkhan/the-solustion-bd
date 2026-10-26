import { Module } from "@nestjs/common";
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
  ],
})
export class AppModule {}
