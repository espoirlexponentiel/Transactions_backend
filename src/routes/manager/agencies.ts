import { Router, Response } from "express";
import { AgenciesController } from "../../controllers/manager/agencies";
import { authMiddleware } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { AuthRequest } from "../../middleware/authRequest";

const router = Router();

// ✅ Wrapper pour typer correctement AuthRequest
const wrapAuth = <
  BodyType = any,
  ParamsType extends Record<string, any> = Record<string, any>
>(
  handler: (req: AuthRequest<BodyType, ParamsType>, res: Response) => Promise<any>
) => (req: AuthRequest<BodyType, ParamsType>, res: Response) =>
  handler(req as AuthRequest<BodyType, ParamsType>, res);

// ✅ CRUD Agencies
router.post(
  "/",
  authMiddleware,
  requireRole(["manager"]),
  wrapAuth(AgenciesController.create)
);

router.get(
  "/",
  authMiddleware,
  requireRole(["manager", "admin"]),
  wrapAuth(AgenciesController.getAll)
);

// ✅ Récupérer les agences du manager connecté
router.get(
  "/mine",
  authMiddleware,
  requireRole(["manager"]),
  (req, res) => {
    const typedReq = req as AuthRequest;
    return AgenciesController.getMine(typedReq, res);
  }
);

router.get(
  "/:id",
  authMiddleware,
  requireRole(["manager", "admin"]),
  wrapAuth<any, { id: string }>(AgenciesController.getOne)
);

router.put(
  "/:id",
  authMiddleware,
  requireRole(["manager"]),
  wrapAuth<any, { id: string }>(AgenciesController.update)
);

router.delete(
  "/:id",
  authMiddleware,
  requireRole(["manager"]),
  wrapAuth<any, { id: string }>(AgenciesController.delete)
);

export default router;
