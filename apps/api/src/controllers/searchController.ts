import { Request, Response } from "express";
import { productSyncService } from "../services/productSyncService";

export const searchProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await productSyncService.search(req.query as any);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const reindexProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await productSyncService.syncAllProducts();
    res.json({
      success: true,
      message: `Successfully indexed ${result.count} products into Typesense`,
      count: result.count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};
