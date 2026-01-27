import { Router } from "express";
import { AuthController } from "../controllers/auth";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role";

const router = Router();

router.post("/signup-admin", AuthController.signupAdmin);
router.post("/login", AuthController.login);
router.post("/create-manager", authMiddleware, requireRole(["admin"]), AuthController.createManager);
router.post("/create-agent", authMiddleware, requireRole(["manager"]), AuthController.createAgent);

export default router;
