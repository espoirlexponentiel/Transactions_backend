import { Response } from "express";
import { TransactionsService } from "../../services/transactionsServices";
import { WalletsService } from "../../services/walletsServices";
import { ManagerTopupService } from "../../services/ManagerTopupService"; // 🔹 ajout import
import { AuthRequest } from "../../middleware/authRequest";
import { UserRole } from "../../types/auth";

interface TopupBody {
  walletId: number;
  amount: number;
  secretCode?: number;
}

export const ManagerWalletsController = {
  // ✅ Recharger un wallet
  async topup(req: AuthRequest<TopupBody>, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const userRole: UserRole = req.user.role;
      if (userRole !== "manager") {
        return res.status(403).json({ error: "Accès réservé au manager" });
      }

      const { walletId, amount, secretCode } = req.body;
      if (!walletId || !amount || amount <= 0) {
        return res.status(400).json({ error: "walletId et amount (> 0) sont requis" });
      }

      const result = await TransactionsService.createTopup(
        { walletId, amount, secretCode },
        { id: req.user.id, role: userRole }
      );

      return res.status(201).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  // ✅ Récupérer tous les wallets du manager connecté regroupés par agence
  async getMine(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const userRole: UserRole = req.user.role;
      if (userRole !== "manager") {
        return res.status(403).json({ error: "Accès réservé au manager" });
      }

      const walletsByAgencies = await WalletsService.getWalletsByManager(req.user.id);
      return res.json(walletsByAgencies);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  // ✅ Voir les topups par agence et par jour
  async list(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const { date } = req.query;
      const data = await ManagerTopupService.getTopupsByAgency(req.user, date as string);

      return res.json(data);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },
};
