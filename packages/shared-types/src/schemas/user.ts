import { z } from "zod";
import { BRANCH_CODES, USER_ROLES } from "../constants";
import { BD_PHONE_REGEX } from "../phone";

export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(BD_PHONE_REGEX, "Invalid Bangladeshi phone number").nullable().optional(),
  role: z.enum(USER_ROLES).default("CUSTOMER"),
  isEmailVerified: z.boolean().default(false),
  assignedBranch: z.enum(BRANCH_CODES).nullable().optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});
export type UserDTO = z.infer<typeof UserSchema>;

export const RegisterInputSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(BD_PHONE_REGEX, "Invalid Bangladeshi phone number").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().regex(BD_PHONE_REGEX, "Invalid Bangladeshi phone number").optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone is required for login",
  path: ["email"],
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const VerifyEmailInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Verification code must be exactly 6 digits"),
});
export type VerifyEmailInput = z.infer<typeof VerifyEmailInputSchema>;

export const PhoneOtpRequestSchema = z.object({
  phone: z.string().regex(BD_PHONE_REGEX, "Invalid Bangladeshi phone number"),
});
export type PhoneOtpRequest = z.infer<typeof PhoneOtpRequestSchema>;

export const PhoneOtpVerifySchema = z.object({
  phone: z.string().regex(BD_PHONE_REGEX, "Invalid Bangladeshi phone number"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});
export type PhoneOtpVerify = z.infer<typeof PhoneOtpVerifySchema>;

export const ForgotPasswordInputSchema = z.object({
  email: z.string().email("Invalid email address"),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;

export const ResetPasswordInputSchema = z.object({
  token: z.string().min(10, "Invalid reset token"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;

export const ChangePasswordInputSchema = z.object({
  oldPassword: z.string().min(6, "Old password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>;

export const SessionSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  userAgent: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  expiresAt: z.date().or(z.string()),
  createdAt: z.date().or(z.string()).optional(),
});
export type SessionDTO = z.infer<typeof SessionSchema>;
