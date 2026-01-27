import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";

export type UserRole = "admin" | "manager" | "personal";

export interface TokenPayload {
  id: number;
  role: UserRole;
  name: string;
  agencyId?: number;
}

export const AuthService = {
  /**
   * Hash un mot de passe
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  },

  /**
   * Compare un mot de passe avec un hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  /**
   * Génère un token JWT universel
   */
  generateToken(payload: TokenPayload): string {
    // 🔹 On fixe directement la durée à 3 jours
    const options: SignOptions = { expiresIn: "3d" };
    return jwt.sign(payload, JWT_SECRET as string, options);
  },

  /**
   * Vérifie et décode un token JWT
   */
  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET as string) as TokenPayload;
    } catch {
      throw new Error("Token invalide ou expiré ❌");
    }
  },
};
