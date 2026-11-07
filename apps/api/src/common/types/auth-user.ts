import type { UserRole } from "@solusation/shared-types";

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
