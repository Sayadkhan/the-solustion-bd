import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Inject,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { BkashService } from "./bkash.service";

@ApiTags("bKash Payment Gateway")
@Controller("bkash")
export class BkashController {
  constructor(@Inject(BkashService) private readonly bkashService: BkashService) {}

  @ApiOperation({ summary: "Get public bKash configuration and merchant details" })
  @Get("config")
  getConfig() {
    return {
      success: true,
      data: this.bkashService.getConfig(),
    };
  }

  @ApiOperation({ summary: "Create a new bKash Tokenized Checkout session" })
  @Post("create")
  async createPayment(@Body() body: any) {
    if (!body?.amount) {
      throw new BadRequestException("Amount is required");
    }
    const payment = await this.bkashService.createPayment({
      amount: Number(body.amount),
      invoiceNo: body.invoiceNo || `SOL-INV-${Date.now()}`,
      customerPhone: body.customerPhone,
      callbackUrl: body.callbackUrl,
    });

    return {
      success: true,
      data: payment,
    };
  }

  @ApiOperation({ summary: "Execute bKash Payment upon PIN/OTP confirmation" })
  @Post("execute")
  async executePayment(@Body() body: any) {
    if (!body?.paymentID) {
      throw new BadRequestException("paymentID is required");
    }

    const receipt = await this.bkashService.executePayment({
      paymentID: body.paymentID,
      invoiceNo: body.invoiceNo,
    });

    return {
      success: true,
      data: receipt,
    };
  }

  @ApiOperation({ summary: "Query bKash payment transaction status" })
  @Get("query/:paymentId")
  async queryPayment(@Param("paymentId") paymentId: string) {
    const status = await this.bkashService.queryPayment(paymentId);
    return {
      success: true,
      data: status,
    };
  }

  @ApiOperation({ summary: "Verify a customer-provided bKash TrxID" })
  @Post("verify-trx")
  verifyTrx(@Body("trxId") trxId: string) {
    const verified = this.bkashService.verifyTrx(trxId);
    return {
      success: true,
      data: verified,
    };
  }
}
