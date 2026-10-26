import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PcBuilderService } from "./pc-builder.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthUserPayload } from "../../middlewares/authMiddleware";

@ApiTags("PC Builder")
@Controller("pc-builder")
export class PcBuilderController {
  constructor(@Inject(PcBuilderService) private readonly pcBuilderService: PcBuilderService) {}

  @ApiOperation({ summary: "Validate PC parts compatibility, 1.25x PSU headroom, and gaming FPS" })
  @Post("validate")
  async validateBuild(@Body() body: any) {
    const result = await this.pcBuilderService.validateBuildByProductIds(body);
    return { success: true, data: result };
  }

  @ApiOperation({ summary: "Save and generate shareable PC quotation link" })
  @Post("save")
  async saveBuild(@Body() body: any, @CurrentUser() user: AuthUserPayload | null) {
    const build = await this.pcBuilderService.saveBuild({
      ...body,
      userId: user?.id || body.userId,
    });
    return {
      success: true,
      message: "Build quotation saved successfully",
      shortCode: build.shortCode,
      data: build,
    };
  }

  @ApiOperation({ summary: "Retrieve saved PC quotation by shortCode" })
  @Get("share/:shareId")
  async getBuildByShareId(@Param("shareId") shareId: string) {
    const build = await this.pcBuilderService.getBuildByShortCode(shareId);
    return { success: true, data: build };
  }
}
