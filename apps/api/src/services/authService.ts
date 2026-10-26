import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { db, users, sessions, eq, or, and, gt } from "@solusation/database";
import {
  RegisterInput,
  LoginInput,
  normalizeBdPhone,
  UserRole,
} from "@solusation/shared-types";
import { ENV } from "../config/env";
import { redis } from "../config/redis";
import { AuthUserPayload } from "../middlewares/authMiddleware";

export class AuthService {
  private generateTokens(payload: AuthUserPayload) {
    const accessToken = jwt.sign(payload, ENV.JWT.ACCESS_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(
      { id: payload.id },
      ENV.JWT.REFRESH_SECRET,
      { expiresIn: "7d" }
    );
    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  async register(input: RegisterInput) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedPhone = input.phone ? normalizeBdPhone(input.phone) : null;

    // Check existing
    const existing = await db.query.users.findFirst({
      where: normalizedPhone
        ? or(eq(users.email, normalizedEmail), eq(users.phone, normalizedPhone))
        : eq(users.email, normalizedEmail),
    });

    if (existing) {
      if (existing.email === normalizedEmail) {
        throw new Error("An account with this email address already exists.");
      }
      if (normalizedPhone && existing.phone === normalizedPhone) {
        throw new Error("An account with this mobile number already exists.");
      }
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const [newUser] = await db
      .insert(users)
      .values({
        name: input.name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash,
        role: "CUSTOMER",
        isEmailVerified: false,
        verificationCode,
        verificationCodeExpiresAt,
      })
      .returning();

    // In a production environment, send email verification code via Nodemailer
    console.log(`[AUTH] 📧 Verification code for ${newUser.email}: ${verificationCode}`);

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
      },
      message: "Registration successful. Please verify your 6-digit email code.",
      devVerificationCode: ENV.NODE_ENV !== "production" ? verificationCode : undefined,
    };
  }

  async verifyEmail(email: string, code: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!user) {
      throw new Error("User with specified email not found.");
    }

    if (user.isEmailVerified) {
      return { message: "Email is already verified. You can log in directly." };
    }

    if (!user.verificationCode || user.verificationCode !== code.trim()) {
      throw new Error("Invalid verification code.");
    }

    if (
      user.verificationCodeExpiresAt &&
      new Date(user.verificationCodeExpiresAt) < new Date()
    ) {
      throw new Error("Verification code has expired. Please request a new one.");
    }

    await db
      .update(users)
      .set({
        isEmailVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { success: true, message: "Email verified successfully. You may now log in." };
  }

  async login(input: LoginInput, userAgent?: string, ipAddress?: string) {
    let user;
    if (input.email) {
      const email = input.email.trim().toLowerCase();
      user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
    } else if (input.phone) {
      const phone = normalizeBdPhone(input.phone) || input.phone;
      user = await db.query.users.findFirst({
        where: eq(users.phone, phone),
      });
    }

    if (!user) {
      throw new Error("Invalid credentials. Please verify email/phone and password.");
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error("Invalid credentials. Please verify email/phone and password.");
    }

    const payload: AuthUserPayload = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      assignedBranch: user.assignedBranch,
    };

    const { accessToken, refreshToken } = this.generateTokens(payload);
    const refreshTokenHash = this.hashToken(refreshToken);

    // Save session (7 days expiry)
    await db.insert(sessions).values({
      userId: user.id,
      refreshTokenHash,
      userAgent: userAgent || "unknown",
      ipAddress: ipAddress || "unknown",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        assignedBranch: user.assignedBranch,
      },
      accessToken,
      refreshToken,
    };
  }

  async requestPhoneOtp(rawPhone: string) {
    const phone = normalizeBdPhone(rawPhone);
    if (!phone) {
      throw new Error("Invalid Bangladeshi phone number format (e.g. 01700000000).");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Cache in Redis for 5 minutes
    try {
      await redis.set(`otp:phone:${phone}`, otp, "EX", 300);
    } catch {
      // Degraded fallback
    }

    console.log(`[SMS OTP STUB] 📱 OTP for ${phone}: ${otp}`);

    return {
      success: true,
      phone,
      message: `OTP sent to ${phone}. Valid for 5 minutes.`,
      devOtp: ENV.NODE_ENV !== "production" ? otp : undefined,
    };
  }

  async verifyPhoneOtp(
    rawPhone: string,
    otp: string,
    userAgent?: string,
    ipAddress?: string
  ) {
    const phone = normalizeBdPhone(rawPhone) || rawPhone;
    const cleanOtp = otp.trim();

    // Verify against Redis (or dev default 123456)
    let cachedOtp: string | null = null;
    try {
      cachedOtp = await redis.get(`otp:phone:${phone}`);
    } catch {
      // Degraded fallback
    }

    const isDevFallback = ENV.NODE_ENV !== "production" && cleanOtp === "123456";
    if (cachedOtp !== cleanOtp && !isDevFallback) {
      throw new Error("Invalid or expired OTP. Please request a new code.");
    }

    // Invalidate OTP in Redis
    try {
      await redis.del(`otp:phone:${phone}`);
    } catch {
      // Ignore
    }

    // Find or create customer
    let user = await db.query.users.findFirst({
      where: eq(users.phone, phone),
    });

    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      const [newUser] = await db
        .insert(users)
        .values({
          name: `Customer ${phone.slice(-4)}`,
          email: `${phone}@customer.solusationbd.internal`,
          phone,
          passwordHash,
          role: "CUSTOMER",
          isEmailVerified: false,
        })
        .returning();
      user = newUser;
    }

    const payload: AuthUserPayload = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      assignedBranch: user.assignedBranch,
    };

    const { accessToken, refreshToken } = this.generateTokens(payload);
    const refreshTokenHash = this.hashToken(refreshToken);

    await db.insert(sessions).values({
      userId: user.id,
      refreshTokenHash,
      userAgent: userAgent || "unknown",
      ipAddress: ipAddress || "unknown",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        assignedBranch: user.assignedBranch,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(rawRefreshToken: string, userAgent?: string, ipAddress?: string) {
    try {
      const decoded = jwt.verify(
        rawRefreshToken,
        ENV.JWT.REFRESH_SECRET
      ) as { id: string };

      const tokenHash = this.hashToken(rawRefreshToken);
      const session = await db.query.sessions.findFirst({
        where: and(
          eq(sessions.userId, decoded.id),
          eq(sessions.refreshTokenHash, tokenHash),
          gt(sessions.expiresAt, new Date())
        ),
      });

      if (!session) {
        throw new Error("Session expired or invalid refresh token.");
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.id),
      });

      if (!user) {
        throw new Error("User account no longer exists.");
      }

      const payload: AuthUserPayload = {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        assignedBranch: user.assignedBranch,
      };

      const tokens = this.generateTokens(payload);
      const newHash = this.hashToken(tokens.refreshToken);

      // Rotate session
      await db
        .update(sessions)
        .set({
          refreshTokenHash: newHash,
          userAgent: userAgent || session.userAgent,
          ipAddress: ipAddress || session.ipAddress,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })
        .where(eq(sessions.id, session.id));

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch {
      throw new Error("Invalid or expired refresh token. Please sign in again.");
    }
  }

  async logout(rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await db
        .delete(sessions)
        .where(eq(sessions.refreshTokenHash, tokenHash));
    }
    return { success: true, message: "Logged out successfully." };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!user) {
      // Don't disclose user existence for security
      return {
        success: true,
        message: "If an account with that email exists, password reset instructions were sent.",
      };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db
      .update(users)
      .set({
        resetPasswordToken: resetToken,
        resetPasswordExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log(`[AUTH] 🔑 Password reset token for ${user.email}: ${resetToken}`);

    return {
      success: true,
      message: "If an account with that email exists, password reset instructions were sent.",
      devResetToken: ENV.NODE_ENV !== "production" ? resetToken : undefined,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.resetPasswordToken, token),
        gt(users.resetPasswordExpiresAt, new Date())
      ),
    });

    if (!user) {
      throw new Error("Password reset token is invalid or has expired.");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Revoke all existing sessions for security
    await db.delete(sessions).where(eq(sessions.userId, user.id));

    return { success: true, message: "Password updated successfully. Please log in with your new password." };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error("User not found.");
    }

    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) {
      throw new Error("Current password is incorrect.");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { success: true, message: "Password changed successfully." };
  }

  async getMe(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error("User not found.");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      assignedBranch: user.assignedBranch,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
