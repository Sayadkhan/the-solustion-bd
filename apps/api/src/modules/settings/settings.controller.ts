import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { SettingsService } from "./settings.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("Settings & Inquiries")
@Controller("settings")
export class SettingsController {
  constructor(@Inject(SettingsService) private readonly settingsService: SettingsService) {}

  @ApiOperation({ summary: "Get global site settings" })
  @Get()
  async getSettings() {
    const settings = await this.settingsService.getSiteSettings();
    return { success: true, data: settings };
  }

  @ApiOperation({ summary: "Update global site settings (Admin only)" })
  @Put()
  async updateSettings(@Body() body: any) {
    const updated = await this.settingsService.updateSiteSettings(body);
    return { success: true, message: "Settings updated successfully", data: updated };
  }

  @ApiOperation({ summary: "Submit customer or B2B corporate quotation inquiry" })
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
  @Get("inquiries")
  async getInquiries(@Query("limit") limit?: string, @Query("page") page?: string) {
    const l = limit ? parseInt(limit, 10) : 20;
    const p = page ? parseInt(page, 10) : 1;
    const inquiries = await this.settingsService.getContactInquiries(l, p);
    return { success: true, count: inquiries.length, data: inquiries };
  }

  @ApiOperation({ summary: "Update inquiry status (Admin only)" })
  @Patch("inquiries/:id/status")
  async updateInquiryStatus(
    @Param("id") id: string,
    @Body() body: { status: "PENDING" | "CONTACTED" | "RESOLVED" }
  ) {
    const updated = await this.settingsService.updateInquiryStatus(id, body.status);
    return { success: true, message: "Inquiry status updated", data: updated };
  }
}

