import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";
import { UserRole } from "../types/auth"; // ✅ ton type global pour les rôles

// ✅ Étendre Request pour TypeScript
export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: UserRole;
    name: string;
    agencyId?: number; // 🔹 optionnel si tu veux inclure l’agence active
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token manquant" });
  }

  const token = authHeader.split(" ")[1]; // ✅ format "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as {
      id: number;
      role: UserRole;
      name: string;
      agencyId?: number;
    };

    req.user = decoded; // ✅ injecte l’utilisateur dans la requête
    next();
  } catch (error) {
    return res.status(403).json({ error: "Token invalide ou expiré ❌" });
  }
};
