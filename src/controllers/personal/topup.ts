import { Response } from "express";
import { TransactionsService } from "../../services/transactionsServices";
import { PersonalTopupService } from "../../services/PersonalTopupService";
import { AuthRequest } from "../../middleware/authRequest";
import { UserRole } from "../../types/auth";

interface TopupBody {
  walletId: number;
  amount: number;
  secretCode?: number;
}

export const PersonalTopupController = {
  // 🔹 Créer un topup
  async topup(req: AuthRequest<TopupBody>, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Utilisateur non authentifié" });
      if (req.user.role !== "personal") return res.status(403).json({ error: "Accès réservé au personal" });

      const { walletId, amount, secretCode } = req.body;
      if (!walletId || !amount || amount <= 0) {
        return res.status(400).json({ error: "walletId et amount (> 0) sont requis" });
      }

      const result = await TransactionsService.createTopup(
        { walletId, amount, secretCode },
        { id: req.user.id, role: req.user.role }
      );

      return res.status(201).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },


  // ✅ Voir l’historique des topups du personal dans une agence donnée
  async list(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      if (req.user.role !== "personal") {
        return res.status(403).json({ error: "Accès réservé au personal" });
      }

      const { agencyId, date } = req.query;
      if (!agencyId) {
        return res.status(400).json({ error: "agencyId est requis" });
      }

      const data = await PersonalTopupService.getTopupsByAgency(
        req.user.id,
        Number(agencyId),
        date as string
      );

      return res.json(data);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },


}
