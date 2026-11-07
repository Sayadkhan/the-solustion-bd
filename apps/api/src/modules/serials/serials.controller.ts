import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { SerialsService } from "./serials.service";
import { Public } from "../../common/decorators/public.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("Serials & Warranty")
@Controller("serials")
export class SerialsController {
  constructor(@Inject(SerialsService) private readonly serialsService: SerialsService) {}

  @ApiOperation({ summary: "Rule 4.4 Hardware Serial Warranty Lookup" })
  @Public()
  @RateLimit(60, 15 * 60)
  @Get("warranty/:serialNumber")
  async lookupWarranty(@Param("serialNumber") serialNumber: string) {
    if (!serialNumber) {
      throw new BadRequestException("Serial number is required");
    }
    const result = await this.serialsService.lookupWarranty(serialNumber);
    return { success: true, data: result };
  }

  @ApiOperation({ summary: "List all registered hardware serials (Admin only)" })
  @Roles("ADMIN", "BRANCH_MANAGER", "BRANCH_STAFF")
  @Get()
  async getSerials() {
    const list = await this.serialsService.getAllSerials();
    return { success: true, count: list.length, data: list };
  }

  @ApiOperation({ summary: "Register new hardware box serial (Admin only)" })
  @Roles("ADMIN", "BRANCH_MANAGER", "BRANCH_STAFF")
  @Post()
  async registerSerial(@Body() body: any) {
    const record = await this.serialsService.registerSerial(body);
    return { success: true, message: "Serial registered successfully", data: record };
  }
}

