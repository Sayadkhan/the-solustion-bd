import { Router } from "express";
import {
  register,
  verifyEmail,
  login,
  requestOtp,
  verifyOtp,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
} from "../controllers/authController";
import { validateBody } from "../middlewares/validateRequest";
import { authenticateToken } from "../middlewares/authMiddleware";
import {
  RegisterInputSchema,
  VerifyEmailInputSchema,
  LoginInputSchema,
  PhoneOtpRequestSchema,
  PhoneOtpVerifySchema,
  ForgotPasswordInputSchema,
  ResetPasswordInputSchema,
  ChangePasswordInputSchema,
} from "@solusation/shared-types";

const router = Router();

router.post("/register", validateBody(RegisterInputSchema), register);
router.post("/verify-email", validateBody(VerifyEmailInputSchema), verifyEmail);
router.post("/login", validateBody(LoginInputSchema), login);
router.post("/otp/request", validateBody(PhoneOtpRequestSchema), requestOtp);
router.post("/otp/verify", validateBody(PhoneOtpVerifySchema), verifyOtp);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/forgot-password", validateBody(ForgotPasswordInputSchema), forgotPassword);
router.post("/reset-password", validateBody(ResetPasswordInputSchema), resetPassword);
router.post("/change-password", authenticateToken, validateBody(ChangePasswordInputSchema), changePassword);
router.get("/me", authenticateToken, getMe);

export default router;
