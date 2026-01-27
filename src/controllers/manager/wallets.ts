import { Response } from "express";
import { TransactionsService } from "../../services/transactionsServices"; // ✅ corrigé (sans "s")
import { AuthRequest } from "../../middleware/authRequest";
import { UserRole } from "../../types/auth";

interface TopupBody {
  walletId: number;
  amount: number;
  secretCode?: number;
}

export const ManagerWalletsController = {
  async topup(req: AuthRequest<TopupBody>, res: Response) {
    try {
      // 🔐 Vérification auth
      if (!req.user) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const userRole: UserRole = req.user.role;

      // 🔐 Vérification rôle
      if (userRole !== "manager") {
        return res.status(403).json({
          error: "Accès réservé au manager",
        });
      }

      const { walletId, amount, secretCode } = req.body;

      // ✅ Validation du body
      if (!walletId || !amount || amount <= 0) {
        return res.status(400).json({
          error: "walletId et amount (> 0) sont requis",
        });
      }

      // ✅ Appel service avec AuthUser (user_id + role)
      const result = await TransactionsService.createTopup(
        { walletId, amount, secretCode },
        {
          id: req.user.id,   // ⚠️ correspond au user_id
          role: userRole,
        }
      );

      return res.status(201).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },
};
