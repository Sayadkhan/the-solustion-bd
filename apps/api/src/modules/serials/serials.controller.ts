import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { SerialsService } from "./serials.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("Serials & Warranty")
@Controller("serials")
export class SerialsController {
  constructor(@Inject(SerialsService) private readonly serialsService: SerialsService) {}

  @ApiOperation({ summary: "Rule 4.4 Hardware Serial Warranty Lookup" })
  @Get("warranty/:serialNumber")
  async lookupWarranty(@Param("serialNumber") serialNumber: string) {
    if (!serialNumber) {
      throw new BadRequestException("Serial number is required");
    }
    const result = await this.serialsService.lookupWarranty(serialNumber);
    return { success: true, data: result };
  }

  @ApiOperation({ summary: "List all registered hardware serials (Admin only)" })
  @Get()
  async getSerials() {
    const list = await this.serialsService.getAllSerials();
    return { success: true, count: list.length, data: list };
  }

  @ApiOperation({ summary: "Register new hardware box serial (Admin only)" })
  @Post()
  async registerSerial(@Body() body: any) {
    const record = await this.serialsService.registerSerial(body);
    return { success: true, message: "Serial registered successfully", data: record };
  }
}

