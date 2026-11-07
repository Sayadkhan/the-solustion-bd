import { Controller, Get, Post, Param, Body, Inject, BadRequestException } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { BkashService } from "./bkash.service";
import { Public } from "../../common/decorators/public.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("bKash Payment Gateway")
@Controller("bkash")
export class BkashController {
  constructor(@Inject(BkashService) private readonly bkashService: BkashService) {}

  @ApiOperation({ summary: "Get public bKash merchant details and whether the gateway is enabled" })
  @Public()
  @Get("config")
  getConfig() {
    return { success: true, data: this.bkashService.getConfig() };
  }

  @ApiOperation({ summary: "Start a bKash checkout for an existing order. The server sets the amount." })
  @Public()
  @RateLimit(20, 15 * 60)
  @Post("create")
  async createPayment(@Body("invoiceNo") invoiceNo: unknown) {
    if (!invoiceNo || typeof invoiceNo !== "string") {
      throw new BadRequestException("invoiceNo is required");
    }
    return { success: true, data: await this.bkashService.createPayment(invoiceNo) };
  }

  @ApiOperation({ summary: "Complete a bKash payment after the customer returns from bKash" })
  @Public()
  @RateLimit(30, 15 * 60)
  @Post("execute")
  async executePayment(@Body("paymentID") paymentID: unknown) {
    if (!paymentID || typeof paymentID !== "string") {
      throw new BadRequestException("paymentID is required");
    }
    return { success: true, data: await this.bkashService.executePayment(paymentID) };
  }

  @ApiOperation({ summary: "Ask bKash for the status of a payment (Admin only)" })
  @Roles("ADMIN")
  @Get("query/:paymentId")
  async queryPayment(@Param("paymentId") paymentId: string) {
    return { success: true, data: await this.bkashService.queryPayment(paymentId) };
  }
}
