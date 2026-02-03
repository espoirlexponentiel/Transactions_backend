import { Router, Response } from "express";
import { ManagerWalletsController } from "../../controllers/manager/wallets";
import { authMiddleware } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { AuthRequest } from "../../middleware/authRequest";

const router = Router();

// Wrapper pour typage AuthRequest
const wrapAuth = <BodyType = any>(
  handler: (req: AuthRequest<BodyType>, res: Response) => Promise<any>
) => (req: AuthRequest<BodyType>, res: Response) =>
  handler(req as AuthRequest<BodyType>, res);

// Type pour le body de topup
interface TopupBody {
  walletId: number;
  amount: number;
  secretCode?: number; // On reçoit string depuis JSON
}

// ✅ Topup
router.post(
  "/topup",
  authMiddleware,
  requireRole(["manager"]),
  wrapAuth<TopupBody>(ManagerWalletsController.topup)
);

router.get( "/mine", authMiddleware, requireRole(["manager"]), ManagerWalletsController.getMine );

// ✅ Voir les topups par agence et par jour 
router.get( "/topups", authMiddleware, requireRole(["manager"]), ManagerWalletsController.list );
export default router;
