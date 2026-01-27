import { Router } from "express";
import { PersonalTransactionsController } from "../../controllers/personal/transactions";
import { authMiddleware } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";

const router = Router();

// ============================
// 🔹 DEPOT (agent → client)
// ============================
router.post(
  "/deposit",
  authMiddleware,
  requireRole(["personal"]),
  PersonalTransactionsController.deposit
);

// ============================
// 🔹 RETRAIT (client → agent)
// ============================
router.post(
  "/withdraw",
  authMiddleware,
  requireRole(["personal"]),
  PersonalTransactionsController.withdraw
);

// ============================
// 🔹 HISTORIQUE DES TRANSACTIONS
// ============================
router.get(
  "/history",
  authMiddleware,
  requireRole(["personal"]),
  PersonalTransactionsController.history
);

// ============================
// 🔹 CONFIRMATION TRANSACTION
// ============================
router.patch(
  "/:id/confirm",
  authMiddleware,
  requireRole(["personal"]),
  PersonalTransactionsController.confirm
);

// ============================
// 🔹 RENVOI DU CODE USSD
// ============================
router.post(
  "/:id/resend",
  authMiddleware,
  requireRole(["personal"]),
  PersonalTransactionsController.resend
);

export default router;
