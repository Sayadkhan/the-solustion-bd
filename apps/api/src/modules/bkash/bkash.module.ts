import { Module } from "@nestjs/common";
import { BkashController } from "./bkash.controller";
import { BkashService } from "./bkash.service";

@Module({
  controllers: [BkashController],
  providers: [BkashService],
  exports: [BkashService],
})
export class BkashModule {}
