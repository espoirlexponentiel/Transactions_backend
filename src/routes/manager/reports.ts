import { Router } from "express";
import { ManagerStatsController } from "../../controllers/manager/reports";
import { authMiddleware } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";

const router = Router();

router.get(
  "/dashboard",
  authMiddleware,
  requireRole(["manager"]),
  ManagerStatsController.stats
);

export default router;
