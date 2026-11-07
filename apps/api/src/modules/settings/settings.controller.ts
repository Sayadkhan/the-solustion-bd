import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { SettingsService } from "./settings.service";
import { Public } from "../../common/decorators/public.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthUserPayload } from "../../common/types/auth-user";
import { parsePagination } from "../../common/utils/pagination";

@ApiTags("Settings & Inquiries")
@Controller("settings")
export class SettingsController {
  constructor(@Inject(SettingsService) private readonly settingsService: SettingsService) {}

  @ApiOperation({ summary: "Get global site settings" })
  @Public()
  @Get()
  async getSettings() {
    const settings = await this.settingsService.getSiteSettings();
    return { success: true, data: settings };
  }

  @ApiOperation({ summary: "Update global site settings (Admin only)" })
  @Roles("ADMIN", "SEO_MANAGER")
  @Put()
  async updateSettings(@Body() body: any, @CurrentUser() user: AuthUserPayload) {
    const updated = await this.settingsService.updateSiteSettings(body, user.role);
    return { success: true, message: "Settings updated successfully", data: updated };
  }

  @ApiOperation({ summary: "Submit customer or B2B corporate quotation inquiry" })
  @Public()
  @RateLimit(5, 15 * 60)
  @Post("inquiry")
  async submitInquiry(@Body() body: any) {
    const { name, email, phone, subject, message } = body;
    if (!name || !email || !phone || !subject || !message) {
      throw new BadRequestException("All required contact fields must be provided.");
    }
    const inquiry = await this.settingsService.submitContactInquiry(body);
    return {
      success: true,
      message: "Thank you for reaching out! Our team will contact you shortly.",
      inquiryId: inquiry.id,
    };
  }

  @ApiOperation({ summary: "Get customer and B2B inquiries (Admin only)" })
  @Roles("ADMIN")
  @Get("inquiries")
  async getInquiries(@Query("limit") limit?: string, @Query("page") page?: string) {
    const { limit: l, page: p } = parsePagination(limit, page, { limit: 20 });
    const inquiries = await this.settingsService.getContactInquiries(l, p);
    return { success: true, count: inquiries.length, data: inquiries };
  }

  @ApiOperation({ summary: "Update inquiry status (Admin only)" })
  @Roles("ADMIN")
  @Patch("inquiries/:id/status")
  async updateInquiryStatus(
    @Param("id") id: string,
    @Body() body: { status: "PENDING" | "CONTACTED" | "RESOLVED" }
  ) {
    const updated = await this.settingsService.updateInquiryStatus(id, body.status);
    return { success: true, message: "Inquiry status updated", data: updated };
  }
}

