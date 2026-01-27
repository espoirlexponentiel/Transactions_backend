import { Router, Response } from "express";
import { PersonalsController } from "../../controllers/manager/personals";
import { authMiddleware } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { AuthRequest } from "../../middleware/authRequest";

const router = Router();

// ✅ Wrapper simple
const wrapAuth = <BodyType = any>(
  handler: (req: AuthRequest<BodyType>, res: Response) => Promise<any>
) => (req: AuthRequest<BodyType>, res: Response) =>
  handler(req as AuthRequest<BodyType>, res);

// Types pour body
interface AssignBody {
  personalId: number;
  agencyId: number;
}

interface UnassignBody {
  personalId: number;
  agencyId: number;
}

// ✅ Affecter un Personal à une Agency
router.post(
  "/assign",
  authMiddleware,
  requireRole(["manager"]),
  wrapAuth<AssignBody>(PersonalsController.assign)
);

// ✅ Récupérer tous les Personals d’une Agency
router.get(
  "/agency/:agencyId",
  authMiddleware,
  requireRole(["manager", "admin"]),
  (req, res) => {
    // cast directement ici
    const typedReq = req as AuthRequest<any, { agencyId: string }>;
    return PersonalsController.getByAgency(typedReq, res);
  }
);

// ✅ Retirer un Personal d’une Agency
router.delete(
  "/unassign",
  authMiddleware,
  requireRole(["manager"]),
  wrapAuth<UnassignBody>(PersonalsController.unassign)
);

export default router;
