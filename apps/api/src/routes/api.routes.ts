import { Router } from "express";
import authRoutes from "./authRoutes";
import searchRoutes from "./searchRoutes";
import pcBuilderRoutes from "./pcBuilderRoutes";
import settingsRoutes from "./settingsRoutes";
import {
  getFeaturedProducts,
  getProductBySlug,
  getProducts,
} from "../controllers/productController";
import {
  createOrder,
  getOrderByNumber,
  getOrders,
} from "../controllers/orderController";
import { lookupWarranty } from "../controllers/serialController";
import { getHealthStatus } from "../controllers/healthController";
import { validateBody } from "../middlewares/validateRequest";
import { OrderSchema } from "@solusation/shared-types";

const router: Router = Router();

// Health Check
router.get("/health", getHealthStatus);

// 1. Authentication Module (/api/v1/auth)
router.use("/auth", authRoutes);

// 2. Typesense Instant Search Module (/api/v1/search)
router.use("/search", searchRoutes);

// 3. PC Builder & Compatibility Engine (/api/v1/pc-builder)
router.use("/pc-builder", pcBuilderRoutes);

// 4. Site Settings & Inquiries (/api/v1/settings)
router.use("/settings", settingsRoutes);

// Products
router.get("/products/featured", getFeaturedProducts);
router.get("/products", getProducts);
router.get("/products/:slug", getProductBySlug);

// Orders
router.post("/orders", validateBody(OrderSchema), createOrder);
router.get("/orders", getOrders);
router.get("/orders/:orderNumber", getOrderByNumber);

// Serial Number Warranty Lookup (Rule 4.4)
router.get("/serials/warranty/:serialNumber", lookupWarranty);

export default router;
