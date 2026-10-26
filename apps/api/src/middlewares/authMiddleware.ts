import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { UserRole } from "@solusation/shared-types";

export interface AuthUserPayload {
  id: string;
  email: string;
  role: UserRole;
  assignedBranch?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
      return;
    }

    const decoded = jwt.verify(token, ENV.JWT.ACCESS_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired access token.",
    });
  }
};

export const optionalAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (token) {
      const decoded = jwt.verify(token, ENV.JWT.ACCESS_SECRET) as AuthUserPayload;
      req.user = decoded;
    }
    next();
  } catch {
    // If token invalid, proceed without req.user
    next();
  }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    // SUPER_ADMIN always has full access
    if (req.user.role === "SUPER_ADMIN" || allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: `Access denied. Requires one of roles: [${allowedRoles.join(", ")}]. Current role: ${req.user.role}`,
    });
  };
};
