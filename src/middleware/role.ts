import { Response, NextFunction } from "express";
import { AuthRequest } from "./authRequest";
import { UserRole } from "../types/auth";

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Accès interdit : rôle insuffisant",
      });
    }
    next();
  };
};
