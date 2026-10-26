import { Router } from "express";
import {
  validateBuild,
  saveBuild,
  getBuildByShortCode,
} from "../controllers/pcBuilderController";
import { optionalAuthenticate } from "../middlewares/authMiddleware";

const router = Router();

router.post("/validate", validateBuild);
router.post("/save", optionalAuthenticate, saveBuild);
router.get("/:shortCode", getBuildByShortCode);

export default router;
