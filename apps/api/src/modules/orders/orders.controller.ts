import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { CreateOrderSchema } from "@solusation/shared-types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("Orders")
@Controller("orders")
export class OrdersController {
  constructor(@Inject(OrdersService) private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: "Place a new customer order with Rule 4.5 COD logic" })
  @Post()
  async createOrder(@Body() body: any) {
    const parsed = CreateOrderSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || "Invalid order payload");
    }
    const order = await this.ordersService.createOrder(parsed.data as any);
    return {
      success: true,
      message: "Order placed successfully",
      data: order,
    };
  }

  @ApiOperation({ summary: "List orders (Admin & Branch Manager)" })
  @Get()
  async getOrders(@Query("limit") limit?: string, @Query("page") page?: string) {
    const l = limit ? parseInt(limit, 10) : 20;
    const p = page ? parseInt(page, 10) : 1;
    const orders = await this.ordersService.getOrders(l, p);
    return { success: true, count: orders.length, data: orders };
  }

  @ApiOperation({ summary: "Get order details by invoice number" })
  @Get(":orderNumber")
  async getOrderByNumber(@Param("orderNumber") orderNumber: string) {
    const order = await this.ordersService.getOrderByNumber(orderNumber);
    return { success: true, data: order };
  }

  @ApiOperation({ summary: "Update order status (Admin only)" })
  @Patch(":orderNumber/status")
  async updateStatus(
    @Param("orderNumber") orderNumber: string,
    @Body("status") status: string
  ) {
    if (!status) {
      throw new BadRequestException("Status is required");
    }
    const updated = await this.ordersService.updateOrderStatus(orderNumber, status);
    return { success: true, message: "Order status updated", data: updated };
  }

  @ApiOperation({ summary: "Verify Outside Dhaka advance deposit (Admin only)" })
  @Patch(":orderNumber/deposit")
  async verifyDeposit(
    @Param("orderNumber") orderNumber: string,
    @Body("trxId") trxId: string,
    @Body("amount") amount: number
  ) {
    if (!trxId || !amount) {
      throw new BadRequestException("trxId and amount are required");
    }
    const updated = await this.ordersService.verifyDeposit(orderNumber, trxId, amount);
    return { success: true, message: "Advance deposit verified and marked paid", data: updated };
  }
}
