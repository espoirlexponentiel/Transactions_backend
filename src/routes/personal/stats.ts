import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { StatsController } from "../../controllers/personal/stats";

const router = Router();

router.get(
  "/daily",
  authMiddleware,
  requireRole(["personal"]),
  StatsController.dailyStats
);

export default router;
