import { Module } from "@nestjs/common";
import { PcBuilderController } from "./pc-builder.controller";
import { PcBuilderService } from "./pc-builder.service";

@Module({
  controllers: [PcBuilderController],
  providers: [PcBuilderService],
  exports: [PcBuilderService],
})
export class PcBuilderModule {}
