import { Router } from "express";
import { searchProducts, reindexProducts } from "../controllers/searchController";
import { validateQuery } from "../middlewares/validateRequest";
import { ProductSearchQuerySchema } from "@solusation/shared-types";
import { authenticateToken, requireRole } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", validateQuery(ProductSearchQuerySchema), searchProducts);
router.get("/products", validateQuery(ProductSearchQuerySchema), searchProducts);
router.post("/reindex", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN"), reindexProducts);

export default router;
