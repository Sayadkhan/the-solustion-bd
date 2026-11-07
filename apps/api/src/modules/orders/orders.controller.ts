import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { CreateOrderSchema } from "@solusation/shared-types";
import { Public } from "../../common/decorators/public.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { parsePagination } from "../../common/utils/pagination";

@ApiTags("Orders")
@Controller("orders")
export class OrdersController {
  constructor(@Inject(OrdersService) private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: "Place a customer order. All amounts are calculated by the server." })
  @Public()
  @RateLimit(20, 60 * 60)
  @Post()
  async createOrder(@Body() body: unknown) {
    const parsed = CreateOrderSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || "Invalid order payload");
    }
    const order = await this.ordersService.createOrder(parsed.data);
    return {
      success: true,
      message: "Order placed successfully",
      data: order,
    };
  }

  @ApiOperation({ summary: "List orders (Admin & Branch staff)" })
  @Roles("ADMIN", "BRANCH_MANAGER", "BRANCH_STAFF")
  @Get()
  async getOrders(@Query("limit") limit?: string, @Query("page") page?: string) {
    const { limit: l, page: p } = parsePagination(limit, page, { limit: 20 });
    const orders = await this.ordersService.getOrders(l, p);
    return { success: true, count: orders.length, data: orders };
  }

  @ApiOperation({ summary: "Track an order with its invoice number and the customer's mobile number" })
  @Public()
  @RateLimit(20, 15 * 60)
  @Get("track/:orderNumber")
  async trackOrder(@Param("orderNumber") orderNumber: string, @Query("phone") phone?: string) {
    if (!phone) {
      throw new BadRequestException("Mobile number is required");
    }
    const order = await this.ordersService.trackOrder(orderNumber, phone);
    return { success: true, data: order };
  }

  @ApiOperation({ summary: "Get full order details by invoice number (Admin & Branch staff)" })
  @Roles("ADMIN", "BRANCH_MANAGER", "BRANCH_STAFF")
  @Get(":orderNumber")
  async getOrderByNumber(@Param("orderNumber") orderNumber: string) {
    const order = await this.ordersService.getOrderByNumber(orderNumber);
    return { success: true, data: order };
  }

  @ApiOperation({ summary: "Update order status. Cancelling returns the stock." })
  @Roles("ADMIN", "BRANCH_MANAGER")
  @Patch(":orderNumber/status")
  async updateStatus(@Param("orderNumber") orderNumber: string, @Body("status") status: string) {
    if (!status) {
      throw new BadRequestException("Status is required");
    }
    const updated = await this.ordersService.updateOrderStatus(orderNumber, status);
    return { success: true, message: "Order status updated", data: updated };
  }

  @ApiOperation({ summary: "Record a bKash payment that staff have checked" })
  @Roles("ADMIN", "BRANCH_MANAGER")
  @Patch(":orderNumber/deposit")
  async verifyDeposit(
    @Param("orderNumber") orderNumber: string,
    @Body("trxId") trxId: string,
    @Body("amount") amount?: number
  ) {
    if (!trxId || typeof trxId !== "string") {
      throw new BadRequestException("trxId is required");
    }
    const updated = await this.ordersService.verifyDeposit(orderNumber, trxId, amount);
    return { success: true, message: "Payment verified and recorded", data: updated };
  }
}
