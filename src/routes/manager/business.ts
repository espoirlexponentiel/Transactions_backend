import { Router, Response } from "express";
import { BusinessController } from "../../controllers/manager/business";
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

// ✅ CRUD Business par Manager
router.post(
  "/",
  authMiddleware,
  requireRole(["manager"]),
  wrapAuth(BusinessController.create)
);

router.get(
  "/",
  authMiddleware,
  requireRole(["manager", "admin"]),
  wrapAuth(BusinessController.getAll)
);

router.get(
  "/:id",
  authMiddleware,
  requireRole(["manager", "admin"]),
  wrapAuth<any, { id: string }>(BusinessController.getOne)
);

router.put(
  "/:id",
  authMiddleware,
  requireRole(["manager"]),
  wrapAuth<any, { id: string }>(BusinessController.update)
);

router.delete(
  "/:id",
  authMiddleware,
  requireRole(["manager"]),
  wrapAuth<any, { id: string }>(BusinessController.delete)
);

export default router;
