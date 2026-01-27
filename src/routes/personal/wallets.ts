import { Router, Response } from "express";
import { WalletsController } from "../../controllers/personal/wallets";
import { authMiddleware } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { AuthRequest } from "../../middleware/authRequest";

const router = Router();

// ✅ Wrapper simple pour typer correctement AuthRequest
const wrapAuth = <BodyType = any, ParamsType extends Record<string, any> = Record<string, any>>(
  handler: (req: AuthRequest<BodyType, ParamsType>, res: Response) => Promise<any>
) => (req: AuthRequest<BodyType, ParamsType>, res: Response) =>
  handler(req as AuthRequest<BodyType, ParamsType>, res);

// ✅ Récupérer les wallets d’une Agency
router.get(
  "/:agencyId",
  authMiddleware,
  requireRole(["manager", "personal", "admin"]),
  (req, res) => {
    const typedReq = req as AuthRequest<any, { agencyId: string }>;
    return WalletsController.getByAgency(typedReq, res);
  }
);

export default router;
