import { Injectable, BadRequestException, UnauthorizedException } from "@nestjs/common";
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
import { ENV } from "../../config/env";
import { redis } from "../../config/redis";
import { AuthUserPayload } from "../../middlewares/authMiddleware";

@Injectable()
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
        throw new BadRequestException("An account with this email address already exists.");
      }
      if (normalizedPhone && existing.phone === normalizedPhone) {
        throw new BadRequestException("An account with this mobile number already exists.");
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

    console.log(`[AUTH] 📧 Verification code for ${newUser.email}: ${verificationCode}`);

    const payload: AuthUserPayload = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role as UserRole,
      assignedBranch: (newUser.assignedBranch as any) || undefined,
    };

    const tokens = this.generateTokens(payload);
    await this.storeSession(newUser.id, tokens.refreshToken);

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
      },
      tokens,
    };
  }

  async login(input: LoginInput) {
    const isEmail = Boolean(input.email);
    const identifier = input.email ? input.email.trim() : input.phone ? input.phone.trim() : "";
    const normalizedPhone = !isEmail ? normalizeBdPhone(identifier) : null;

    const user = await db.query.users.findFirst({
      where: isEmail
        ? eq(users.email, identifier.toLowerCase())
        : normalizedPhone
        ? eq(users.phone, normalizedPhone)
        : eq(users.email, identifier),
    });

    if (!user) {
      throw new UnauthorizedException("Invalid email/phone or password.");
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid email/phone or password.");
    }

    const payload: AuthUserPayload = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      assignedBranch: (user.assignedBranch as any) || undefined,
    };

    const tokens = this.generateTokens(payload);
    await this.storeSession(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      tokens,
    };
  }

  private async storeSession(userId: string, refreshToken: string) {
    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    try {
      await db.insert(sessions).values({
        userId,
        refreshTokenHash,
        expiresAt,
      });
    } catch (err) {
      console.error("[AUTH] Error storing session in database:", err);
    }
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException("No refresh token provided");
    }

    try {
      const decoded = jwt.verify(refreshToken, ENV.JWT.REFRESH_SECRET) as { id: string };
      const refreshTokenHash = this.hashToken(refreshToken);

      const activeSession = await db.query.sessions.findFirst({
        where: and(
          eq(sessions.userId, decoded.id),
          eq(sessions.refreshTokenHash, refreshTokenHash),
          gt(sessions.expiresAt, new Date())
        ),
      });

      if (!activeSession) {
        throw new UnauthorizedException("Invalid or revoked session. Please log in again.");
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.id),
      });

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      const payload: AuthUserPayload = {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        assignedBranch: (user.assignedBranch as any) || undefined,
      };

      const tokens = this.generateTokens(payload);
      await db.delete(sessions).where(eq(sessions.id, activeSession.id));
      await this.storeSession(user.id, tokens.refreshToken);

      return { user: payload, tokens };
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      const refreshTokenHash = this.hashToken(refreshToken);
      await db.delete(sessions).where(eq(sessions.refreshTokenHash, refreshTokenHash));
    }
    return { success: true };
  }

  async getUserById(id: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    if (!user) return null;
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
