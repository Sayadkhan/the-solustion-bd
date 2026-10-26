import { Request, Response } from "express";
import { productService } from "../services/productService";

export const getFeaturedProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await productService.getFeaturedProducts();
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getProductBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const product = await productService.getProductBySlug(slug);
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, limit, page } = req.query;
    const products = await productService.getProducts(
      category as string | undefined,
      limit ? parseInt(limit as string, 10) : 24,
      page ? parseInt(page as string, 10) : 1
    );
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
