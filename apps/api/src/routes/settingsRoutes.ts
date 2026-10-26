import { Router } from "express";
import {
  getSiteSettings,
  updateSiteSettings,
  submitContactInquiry,
  getContactInquiries,
} from "../controllers/settingsController";
import { validateBody } from "../middlewares/validateRequest";
import { CreateContactInquirySchema } from "@solusation/shared-types";
import { authenticateToken, requireRole } from "../middlewares/authMiddleware";

const router = Router();

// Public Site Settings (cached in Redis)
router.get("/", getSiteSettings);

// Admin Update Site Settings
router.put("/", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN"), updateSiteSettings);

// Customer / Corporate B2B Contact Inquiry Form
router.post("/inquiry", validateBody(CreateContactInquirySchema), submitContactInquiry);

// Admin View Contact Inquiries
router.get("/inquiries", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN"), getContactInquiries);

export default router;
