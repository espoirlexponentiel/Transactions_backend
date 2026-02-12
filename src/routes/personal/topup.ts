import { Router } from "express";
import { PersonalTopupController } from "../../controllers/personal/topup";
import { authMiddleware } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";

const router = Router();

// 🔹 Créer un topup (personal)
router.post(
  "/charger",
  authMiddleware,
  requireRole(["personal"]),
  PersonalTopupController.topup
);

// 🔹 Consulter l’historique des topups du personal dans une agence
router.get(
  "/charger/history",
  authMiddleware,
  requireRole(["personal"]),
  PersonalTopupController.list
);

export default router;
