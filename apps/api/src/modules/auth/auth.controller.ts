import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import type { Response, Request } from "express";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import {
  RegisterInputSchema,
  LoginInputSchema,
  VerifyEmailInputSchema,
  ForgotPasswordInputSchema,
  ResetPasswordInputSchema,
  ChangePasswordInputSchema,
} from "@solusation/shared-types";
import type { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import type { AuthUserPayload } from "../../common/types/auth-user";
import { ENV } from "../../config/env";

const ACCESS_COOKIE_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown, fallbackMessage: string): z.infer<T> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestException(parsed.error.errors[0]?.message || fallbackMessage);
  }
  return parsed.data;
}

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  private setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    const options = { httpOnly: true, secure: ENV.COOKIE_SECURE, sameSite: "lax" as const };
    res.cookie("access_token", tokens.accessToken, { ...options, maxAge: ACCESS_COOKIE_MAX_AGE_MS });
    res.cookie("refresh_token", tokens.refreshToken, { ...options, maxAge: REFRESH_COOKIE_MAX_AGE_MS });
  }

  @ApiOperation({ summary: "Register new customer" })
  @Public()
  @RateLimit(5, 60 * 60)
  @Post("register")
  async register(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const input = parseBody(RegisterInputSchema, body, "Invalid registration data");
    const result = await this.authService.register(input);
    this.setAuthCookies(res, result.tokens);
    return {
      success: true,
      message: "Registration successful. Welcome to The Solutions BD!",
      user: result.user,
    };
  }

  @ApiOperation({ summary: "Login with email or Bangladeshi phone" })
  @Public()
  @RateLimit(10, 15 * 60)
  @HttpCode(HttpStatus.OK)
  @Post("login")
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const input = parseBody(LoginInputSchema, body, "Invalid login credentials");
    const result = await this.authService.login(input);
    this.setAuthCookies(res, result.tokens);
    return { success: true, message: "Login successful", user: result.user };
  }

  @ApiOperation({ summary: "Refresh session access token" })
  @Public()
  @RateLimit(60, 60)
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.refresh(req.cookies?.refresh_token);
    this.setAuthCookies(res, result.tokens);
    return { success: true, user: result.user };
  }

  @ApiOperation({ summary: "Logout user and invalidate session" })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.cookies?.refresh_token);
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    return { success: true, message: "Logged out successfully" };
  }

  @ApiOperation({ summary: "Get currently authenticated user" })
  @Get("me")
  async getMe(@CurrentUser() user: AuthUserPayload) {
    const profile = await this.authService.getUserById(user.id);
    return { success: true, user: profile };
  }

  @ApiOperation({ summary: "Confirm an email address with the emailed 6-digit code" })
  @Public()
  @RateLimit(10, 15 * 60)
  @HttpCode(HttpStatus.OK)
  @Post("verify-email")
  async verifyEmail(@Body() body: unknown) {
    const input = parseBody(VerifyEmailInputSchema, body, "Invalid verification code");
    await this.authService.verifyEmail(input);
    return { success: true, message: "Email verified successfully." };
  }

  @ApiOperation({ summary: "Send a new email verification code to the logged-in user" })
  @RateLimit(5, 60 * 60)
  @HttpCode(HttpStatus.OK)
  @Post("resend-verification")
  async resendVerification(@CurrentUser() user: AuthUserPayload) {
    await this.authService.resendVerification(user.id);
    return { success: true, message: "If your email is unverified, a new code has been sent." };
  }

  @ApiOperation({ summary: "Email a password reset link" })
  @Public()
  @RateLimit(5, 60 * 60)
  @HttpCode(HttpStatus.OK)
  @Post("forgot-password")
  async forgotPassword(@Body() body: unknown) {
    const input = parseBody(ForgotPasswordInputSchema, body, "Invalid email address");
    await this.authService.forgotPassword(input.email);
    // The same response either way, so this cannot be used to discover accounts.
    return { success: true, message: "If that email has an account, a reset link has been sent." };
  }

  @ApiOperation({ summary: "Set a new password using an emailed reset token" })
  @Public()
  @RateLimit(10, 60 * 60)
  @HttpCode(HttpStatus.OK)
  @Post("reset-password")
  async resetPassword(@Body() body: unknown) {
    const input = parseBody(ResetPasswordInputSchema, body, "Invalid password reset request");
    await this.authService.resetPassword(input);
    return { success: true, message: "Password updated. Please log in with your new password." };
  }

  @ApiOperation({ summary: "Change password and sign out all other sessions" })
  @RateLimit(10, 15 * 60)
  @HttpCode(HttpStatus.OK)
  @Post("change-password")
  async changePassword(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response
  ) {
    const input = parseBody(ChangePasswordInputSchema, body, "Invalid password change request");
    const tokens = await this.authService.changePassword(user.id, input);
    this.setAuthCookies(res, tokens);
    return { success: true, message: "Password changed successfully." };
  }
}
