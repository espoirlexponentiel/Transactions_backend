import { Response } from "express";
import { TransactionsService } from "../../services/transactionsServices";
import { AuthRequest } from "../../middleware/authRequest";

interface DepositBody {
  walletId: number;
  amount: number;
  clientPhone: string;
  clientName?: string;
}

interface WithdrawBody {
  walletId: number;
  amount: number;
  clientPhone: string;
  clientName?: string;
}

export const PersonalTransactionsController = {
  // ============================
  // 🔹 DEPOT
  // ============================
  async deposit(req: AuthRequest<DepositBody>, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const { walletId, amount, clientPhone, clientName } = req.body;

      if (
        !walletId ||
        typeof amount !== "number" ||
        amount <= 0 ||
        !clientPhone
      ) {
        return res.status(400).json({
          error: "walletId, amount (>0) et clientPhone sont requis",
        });
      }

      const data = await TransactionsService.createDeposit(
        { walletId, amount, clientPhone, clientName },
        user
      );

      return res.status(201).json(data);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  },

  // ============================
  // 🔹 RETRAIT
  // ============================
  async withdraw(req: AuthRequest<WithdrawBody>, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const { walletId, amount, clientPhone, clientName } = req.body;

      if (
        !walletId ||
        typeof amount !== "number" ||
        amount <= 0 ||
        !clientPhone
      ) {
        return res.status(400).json({
          error: "walletId, amount (>0) et clientPhone sont requis",
        });
      }

      const data = await TransactionsService.createWithdraw(
        { walletId, amount, clientPhone, clientName },
        user
      );

      return res.status(201).json(data);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  },

  // ============================
  // 🔹 HISTORIQUE
  // ============================
  async history(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const data = await TransactionsService.getPersonalTransactions(user);
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  },

  // ============================
  // 🔹 CONFIRMATION TRANSACTION
  // ============================
  async confirm(
    req: AuthRequest<{ status: "success" | "failed" }, { id: string }>,
    res: Response
  ) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const transactionId = Number(req.params.id);
      const { status } = req.body;

      if (
        isNaN(transactionId) ||
        !status ||
        !["success", "failed"].includes(status)
      ) {
        return res.status(400).json({ error: "Paramètres invalides" });
      }

      const data = await TransactionsService.confirmTransaction(
        transactionId,
        status,
        user
      );

      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  },

  // ============================
  // 🔹 RENVOI USSD
  // ============================
  async resend(req: AuthRequest<{}, { id: string }>, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const transactionId = Number(req.params.id);
      if (isNaN(transactionId)) {
        return res.status(400).json({ error: "ID invalide" });
      }

      const data = await TransactionsService.resendUSSD(transactionId);
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  },
};
