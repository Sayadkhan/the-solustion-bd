import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import type { Response, Request } from "express";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterInputSchema, LoginInputSchema } from "@solusation/shared-types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthUserPayload } from "../../middlewares/authMiddleware";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  private setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("access_token", tokens.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 mins
    });
    res.cookie("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  @ApiOperation({ summary: "Register new customer" })
  @Post("register")
  async register(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const parsed = RegisterInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || "Invalid registration data");
    }
    const result = await this.authService.register(parsed.data);
    this.setAuthCookies(res, result.tokens);
    return {
      success: true,
      message: "Registration successful. Welcome to The Solusation BD!",
      user: result.user,
      accessToken: result.tokens.accessToken,
    };
  }

  @ApiOperation({ summary: "Login with email or Bangladeshi phone" })
  @HttpCode(HttpStatus.OK)
  @Post("login")
  async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const parsed = LoginInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || "Invalid login credentials");
    }
    const result = await this.authService.login(parsed.data);
    this.setAuthCookies(res, result.tokens);
    return {
      success: true,
      message: "Login successful",
      user: result.user,
      accessToken: result.tokens.accessToken,
    };
  }

  @ApiOperation({ summary: "Refresh session access token" })
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    const result = await this.authService.refresh(refreshToken);
    this.setAuthCookies(res, result.tokens);
    return {
      success: true,
      user: result.user,
      accessToken: result.tokens.accessToken,
    };
  }

  @ApiOperation({ summary: "Logout user and invalidate session" })
  @HttpCode(HttpStatus.OK)
  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    await this.authService.logout(refreshToken);
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    return { success: true, message: "Logged out successfully" };
  }

  @ApiOperation({ summary: "Get currently authenticated user" })
  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getMe(@CurrentUser() user: AuthUserPayload) {
    const profile = await this.authService.getUserById(user.id);
    return { success: true, user: profile };
  }
}
