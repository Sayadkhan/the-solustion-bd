import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PcBuilderService } from "./pc-builder.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import type { AuthUserPayload } from "../../common/types/auth-user";

@ApiTags("PC Builder")
@Controller("pc-builder")
export class PcBuilderController {
  constructor(@Inject(PcBuilderService) private readonly pcBuilderService: PcBuilderService) {}

  @ApiOperation({ summary: "List products from the database, grouped by PC builder slot" })
  @Public()
  @Get("parts")
  async getParts() {
    return { success: true, data: await this.pcBuilderService.getParts() };
  }

  @ApiOperation({ summary: "Validate PC parts compatibility, 1.25x PSU headroom, and gaming FPS" })
  @Public()
  @RateLimit(120, 60)
  @Post("validate")
  async validateBuild(@Body("components") components: Record<string, string>) {
    const result = await this.pcBuilderService.validateBuildByProductIds({ components });
    return { success: true, data: result };
  }

  @ApiOperation({ summary: "Save and generate shareable PC quotation link" })
  @Public()
  @RateLimit(20, 15 * 60)
  @Post("save")
  async saveBuild(
    @Body("components") components: Record<string, string>,
    @CurrentUser() user: AuthUserPayload | null
  ) {
    const build = await this.pcBuilderService.saveBuild({
      components,
      userId: user?.id, // Only ever the logged-in user, never a value from the body.
    });
    return {
      success: true,
      message: "Build quotation saved successfully",
      shortCode: build.shortCode,
      data: build,
    };
  }

  @ApiOperation({ summary: "Retrieve saved PC quotation by shortCode" })
  @Public()
  @Get("share/:shareId")
  async getBuildByShareId(@Param("shareId") shareId: string) {
    const build = await this.pcBuilderService.getBuildByShortCode(shareId);
    return { success: true, data: build };
  }
}
