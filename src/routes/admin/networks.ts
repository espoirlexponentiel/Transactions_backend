import { Router, Request, Response } from "express";
import { NetworkController } from "../../controllers/admin/networks";
import { requireRole } from "../../middleware/role";
import { authMiddleware } from "../../middleware/auth";
import { AuthRequest } from "../../middleware/authRequest"; // ✅ import AuthRequest

const router = Router();

// ✅ Helper pour caster Request en AuthRequest et éviter les erreurs TS
const wrapAuth = <
  BodyType = any,
  ParamsType extends Record<string, any> = Record<string, any>
>(
  handler: (req: AuthRequest<BodyType, ParamsType>, res: Response) => Promise<any>
) => (req: Request, res: Response) =>
  handler(req as AuthRequest<BodyType, ParamsType>, res);

// Routes admin pour les networks
router.post("/", authMiddleware, requireRole(["admin"]), wrapAuth(NetworkController.create));
router.get("/", authMiddleware, requireRole(["admin"]), wrapAuth(NetworkController.getAll));
router.delete("/:id", authMiddleware, requireRole(["admin"]), wrapAuth<any, { id: string }>(NetworkController.delete));

export default router;
