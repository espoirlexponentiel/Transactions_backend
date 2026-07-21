import { Response } from "express";
import { WalletsService } from "../../services/walletsServices";
import { AuthRequest } from "../../middleware/authRequest";
import { UserRole } from "../../types/auth";

export const WalletsController = {
  async getByAgency(req: AuthRequest<any, { agencyId: string }>, res: Response) {
    try {
      // 🔐 Vérification auth
      if (!req.user) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const userRole: UserRole = req.user.role;

      // 🔐 Vérification rôle
      if (!["manager", "personal", "admin"].includes(userRole)) {
        return res.status(403).json({
          error: "Accès réservé aux utilisateurs autorisés",
        });
      }

      const agencyId = parseInt(req.params.agencyId, 10);

      // ✅ Validation du paramètre
      if (isNaN(agencyId)) {
        return res.status(400).json({ error: "agencyId invalide" });
      }

      // ✅ Appel service
      const wallets = await WalletsService.getWalletsByAgency(agencyId);

      return res.status(200).json({ agencyId, wallets });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  async resetOne(req: AuthRequest<any, { walletId: string }>, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    const userRole: UserRole = req.user.role;

    if (!["manager", "personal"].includes(userRole)) {
      return res.status(403).json({
        error: "Seuls un manager ou un agent peuvent réinitialiser un wallet",
      });
    }

    const walletId = parseInt(req.params.walletId, 10);
    if (isNaN(walletId)) {
      return res.status(400).json({ error: "walletId invalide" });
    }

    const wallet = await WalletsService.resetWalletById(
      walletId,
      req.user.id,
      userRole
    );

    return res.status(200).json({ wallet, message: "Wallet réinitialisé ✅" });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
},
};
