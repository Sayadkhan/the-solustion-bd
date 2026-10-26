import { Request, Response } from "express";
import { orderService } from "../services/orderService";

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await orderService.createOrder(req.body);
    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const getOrderByNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderNumber } = req.params;
    const order = await orderService.getOrderByNumber(orderNumber);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit, page } = req.query;
    const orders = await orderService.getOrders(
      limit ? parseInt(limit as string, 10) : 20,
      page ? parseInt(page as string, 10) : 1
    );
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
