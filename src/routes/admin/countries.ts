import { Router } from "express";
import { CountryController } from "../../controllers/admin/countries";
import { requireRole } from "../../middleware/role";
import { authMiddleware } from "../../middleware/auth";
import { UserRole } from "../../types/auth";
import { AuthRequest } from "../../middleware/authRequest"; // <-- ajoute ça


// Pour typer les params de la route delete
interface DeleteCountryParams {
  id: string;
}

const router = Router();

// ✅ Seul l’Admin peut gérer les countries
router.post(
  "/",
  authMiddleware,
  requireRole(["admin" as UserRole]),
  CountryController.create
);

router.get(
  "/",
  authMiddleware,
  requireRole(["admin" as UserRole]),
  CountryController.getAll
);

// Ici on dit à Express que req.params a { id: string }
router.delete(
  "/:id",
  authMiddleware,
  requireRole(["admin" as UserRole]),
  (req, res) => CountryController.delete(req as any as AuthRequest<any, DeleteCountryParams>, res)
);

export default router;
