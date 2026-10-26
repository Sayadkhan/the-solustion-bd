import { Request, Response } from "express";
import { authService } from "../services/authService";
import { ENV } from "../config/env";

const isProduction = ENV.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;
    const result = await authService.verifyEmail(email, code);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const userAgent = req.headers["user-agent"];
    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

    const { user, accessToken, refreshToken } = await authService.login(
      req.body,
      userAgent,
      ipAddress
    );

    // Set HTTP-Only cookies
    res.cookie("access_token", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 mins
    });
    res.cookie("refresh_token", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      message: "Login successful",
      data: { user, accessToken, refreshToken },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: (error as Error).message });
  }
};

export const requestOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    const result = await authService.requestPhoneOtp(phone);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = req.body;
    const userAgent = req.headers["user-agent"];
    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

    const { user, accessToken, refreshToken } = await authService.verifyPhoneOtp(
      phone,
      otp,
      userAgent,
      ipAddress
    );

    res.cookie("access_token", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refresh_token", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Phone login successful",
      data: { user, accessToken, refreshToken },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: (error as Error).message });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!token) {
      res.status(401).json({ success: false, message: "Refresh token is missing" });
      return;
    }

    const userAgent = req.headers["user-agent"];
    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

    const result = await authService.refreshToken(token, userAgent, ipAddress);

    res.cookie("access_token", result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refresh_token", result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(401).json({ success: false, message: (error as Error).message });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    await authService.logout(token);

    res.clearCookie("access_token", COOKIE_OPTIONS);
    res.clearCookie("refresh_token", COOKIE_OPTIONS);

    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const { oldPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const user = await authService.getMe(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(404).json({ success: false, message: (error as Error).message });
  }
};
