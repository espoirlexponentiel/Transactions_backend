import { UserRole } from "../types/auth";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: UserRole;
        name: string;
      };
    }
  }
}
