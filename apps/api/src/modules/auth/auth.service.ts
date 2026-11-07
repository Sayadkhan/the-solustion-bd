import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { db, users, sessions, eq, or, and, gt, lt } from "@solusation/database";
import {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ResetPasswordInput,
  ChangePasswordInput,
  normalizeBdPhone,
  UserRole,
} from "@solusation/shared-types";
import { ENV } from "../../config/env";
import { emailService } from "../../services/emailService";
import type { AuthUserPayload } from "../../common/types/auth-user";

const BCRYPT_ROUNDS = 12;
const VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function toPublicUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
  };
}

function toTokenPayload(user: typeof users.$inferSelect): AuthUserPayload {
  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    assignedBranch: user.assignedBranch || undefined,
  };
}

@Injectable()
export class AuthService {
  private generateTokens(payload: AuthUserPayload) {
    const accessToken = jwt.sign(payload, ENV.JWT.ACCESS_SECRET, { expiresIn: "15m" });
    // jti keeps two tokens issued in the same second distinct, as sessions are looked up by hash.
    const refreshToken = jwt.sign({ id: payload.id }, ENV.JWT.REFRESH_SECRET, {
      expiresIn: "7d",
      jwtid: crypto.randomUUID(),
    });
    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private generateVerificationCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  async register(input: RegisterInput) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedPhone = input.phone ? normalizeBdPhone(input.phone) : null;

    const existing = await db.query.users.findFirst({
      where: normalizedPhone
        ? or(eq(users.email, normalizedEmail), eq(users.phone, normalizedPhone))
        : eq(users.email, normalizedEmail),
    });

    if (existing) {
      if (existing.email === normalizedEmail) {
        throw new BadRequestException("An account with this email address already exists.");
      }
      throw new BadRequestException("An account with this mobile number already exists.");
    }

    const verificationCode = this.generateVerificationCode();

    const [newUser] = await db
      .insert(users)
      .values({
        name: input.name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
        role: "CUSTOMER",
        isEmailVerified: false,
        verificationCode,
        verificationCodeExpiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
      })
      .returning();

    this.sendVerificationEmail(newUser.email, newUser.name, verificationCode);

    const tokens = this.generateTokens(toTokenPayload(newUser));
    await this.storeSession(newUser.id, tokens.refreshToken);

    return { user: toPublicUser(newUser), tokens };
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

    const tokens = this.generateTokens(toTokenPayload(user));
    await this.storeSession(user.id, tokens.refreshToken);

    return { user: toPublicUser(user), tokens };
  }

  private async storeSession(userId: string, refreshToken: string) {
    await db.delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));
    await db.insert(sessions).values({
      userId,
      refreshTokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException("No refresh token provided");
    }

    let decoded: { id: string };
    try {
      decoded = jwt.verify(refreshToken, ENV.JWT.REFRESH_SECRET, {
        algorithms: ["HS256"],
      }) as { id: string };
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const activeSession = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.userId, decoded.id),
        eq(sessions.refreshTokenHash, this.hashToken(refreshToken)),
        gt(sessions.expiresAt, new Date())
      ),
    });

    if (!activeSession) {
      throw new UnauthorizedException("Invalid or revoked session. Please log in again.");
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, decoded.id) });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const payload = toTokenPayload(user);
    const tokens = this.generateTokens(payload);
    await db.delete(sessions).where(eq(sessions.id, activeSession.id));
    await this.storeSession(user.id, tokens.refreshToken);

    return { user: payload, tokens };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await db.delete(sessions).where(eq(sessions.refreshTokenHash, this.hashToken(refreshToken)));
    }
    return { success: true };
  }

  async getUserById(id: string) {
    const user = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!user) return null;
    return {
      ...toPublicUser(user),
      assignedBranch: user.assignedBranch,
      createdAt: user.createdAt,
    };
  }

  async verifyEmail(input: VerifyEmailInput) {
    const email = input.email.trim().toLowerCase();
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });

    const isValid =
      user?.verificationCode &&
      user.verificationCodeExpiresAt &&
      user.verificationCodeExpiresAt > new Date() &&
      user.verificationCode === input.code;

    if (!user || !isValid) {
      throw new BadRequestException("This verification code is invalid or has expired.");
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
  }

  async resendVerification(userId: string) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) throw new NotFoundException("User not found");
    if (user.isEmailVerified) return;

    const verificationCode = this.generateVerificationCode();
    await db
      .update(users)
      .set({
        verificationCode,
        verificationCodeExpiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    this.sendVerificationEmail(user.email, user.name, verificationCode);
  }

  async forgotPassword(rawEmail: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, rawEmail.trim().toLowerCase()),
    });
    if (!user) return;

    // Only a hash is stored: a database leak must not expose usable reset links.
    const token = crypto.randomBytes(32).toString("hex");
    await db
      .update(users)
      .set({
        resetPasswordToken: this.hashToken(token),
        resetPasswordExpiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    const resetUrl = `${ENV.ADMIN_URL}/reset-password?token=${token}`;
    emailService.sendPasswordReset(user.email, user.name, resetUrl).catch((err) => {
      console.warn("[AUTH] Password reset email failed:", err.message);
    });
  }

  async resetPassword(input: ResetPasswordInput) {
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.resetPasswordToken, this.hashToken(input.token)),
        gt(users.resetPasswordExpiresAt, new Date())
      ),
    });

    if (!user) {
      throw new BadRequestException("This reset link is invalid or has expired.");
    }

    await db
      .update(users)
      .set({
        passwordHash: await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS),
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await db.delete(sessions).where(eq(sessions.userId, user.id));
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) throw new UnauthorizedException("User not found");

    const isMatch = await bcrypt.compare(input.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException("Your current password is incorrect.");
    }

    await db
      .update(users)
      .set({
        passwordHash: await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await db.delete(sessions).where(eq(sessions.userId, user.id));

    const tokens = this.generateTokens(toTokenPayload(user));
    await this.storeSession(user.id, tokens.refreshToken);
    return tokens;
  }

  private sendVerificationEmail(email: string, name: string, code: string) {
    emailService.sendEmailVerification(email, name, code).catch((err) => {
      console.warn("[AUTH] Verification email failed:", err.message);
    });
  }
}
