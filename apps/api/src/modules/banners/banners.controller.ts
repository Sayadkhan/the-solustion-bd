import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  Inject,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { BannersService } from "./banners.service";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("Banners & Campaign Promotions")
@Controller("banners")
export class BannersController {
  constructor(@Inject(BannersService) private readonly bannersService: BannersService) {}

  @ApiOperation({ summary: "Get active banners for storefront (optional type: HERO | PROMO_SIDE)" })
  @ApiQuery({ name: "type", required: false })
  @Public()
  @Get()
  async getActiveBanners(@Query("type") type?: string) {
    const data = await this.bannersService.getActiveBanners(type);
    return { success: true, count: data.length, data };
  }

  @ApiOperation({ summary: "Get all banners for admin panel (including inactive)" })
  @ApiQuery({ name: "type", required: false })
  @Roles("ADMIN", "SEO_MANAGER")
  @Get("admin")
  async getAllBannersAdmin(@Query("type") type?: string) {
    const data = await this.bannersService.getAllBannersAdmin(type);
    return { success: true, count: data.length, data };
  }

  @ApiOperation({ summary: "Get single banner by id" })
  @Public()
  @Get(":id")
  async getBannerById(@Param("id") id: string) {
    const data = await this.bannersService.getBannerById(id);
    return { success: true, data };
  }

  @ApiOperation({ summary: "Create a new banner" })
  @Roles("ADMIN", "SEO_MANAGER")
  @Post()
  async createBanner(@Body() body: any) {
    if (!body.title || !body.image) {
      throw new BadRequestException("Banner title and image URL are required.");
    }
    const created = await this.bannersService.createBanner(body);
    return { success: true, message: "Banner created successfully.", data: created };
  }

  @ApiOperation({ summary: "Update an existing banner" })
  @Roles("ADMIN", "SEO_MANAGER")
  @Put(":id")
  async updateBanner(@Param("id") id: string, @Body() body: any) {
    const updated = await this.bannersService.updateBanner(id, body);
    return { success: true, message: "Banner updated successfully.", data: updated };
  }

  @ApiOperation({ summary: "Delete a banner" })
  @Roles("ADMIN", "SEO_MANAGER")
  @Delete(":id")
  async deleteBanner(@Param("id") id: string) {
    const res = await this.bannersService.deleteBanner(id);
    return res;
  }

  @ApiOperation({ summary: "Batch reorder banners" })
  @Roles("ADMIN", "SEO_MANAGER")
  @Patch("reorder")
  async reorderBanners(@Body() body: { orders: Array<{ id: string; sortOrder: number }> }) {
    if (!body?.orders || !Array.isArray(body.orders)) {
      throw new BadRequestException("orders array is required.");
    }
    const res = await this.bannersService.reorderBanners(body.orders);
    return res;
  }
}
