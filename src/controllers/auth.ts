import { Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Admin } from "../entities/Admin";
import { Manager } from "../entities/Manager";
import { Personal } from "../entities/Personal";
import { AuthService } from "../services/authService";
import { AuthRequest } from "../middleware/authRequest";

export const AuthController = {
  // 1️⃣ Création Admin (PAS besoin de req.user ici)
  async signupAdmin(req: AuthRequest, res: Response) {
    try {
      const userRepo = AppDataSource.getRepository(User);
      const adminRepo = AppDataSource.getRepository(Admin);

      const { firstName, phone, email, password } = req.body;
      const hashedPassword = await AuthService.hashPassword(password);

      const user = userRepo.create({
        firstName,
        phone,
        email,
        password_hash: hashedPassword,
        role: "admin",
      });
      await userRepo.save(user);

      const admin = adminRepo.create({ user });
      await adminRepo.save(admin);

      return res.status(201).json({ user, admin });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 2️⃣ Connexion
  async login(req: AuthRequest, res: Response) {
    try {
      const userRepo = AppDataSource.getRepository(User);
      const { phone, password } = req.body;

      const user = await userRepo.findOne({ where: { phone } });
      if (!user) {
        return res.status(404).json({ error: "Utilisateur introuvable" });
      }

      const valid = await AuthService.comparePassword(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: "Mot de passe incorrect" });
      }

      const token = AuthService.generateToken({
        id: user.user_id,
        role: user.role,
        name: user.firstName,
      });

      return res.json({ token, role: user.role, name: user.firstName });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 3️⃣ Création Manager par Admin
  async createManager(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          error: "Seul un admin peut créer un manager",
        });
      }

      const userRepo = AppDataSource.getRepository(User);
      const managerRepo = AppDataSource.getRepository(Manager);
      const adminRepo = AppDataSource.getRepository(Admin);

      const admin = await adminRepo.findOne({
        where: { user: { user_id: req.user.id } },
      });
      if (!admin) {
        return res.status(404).json({ error: "Admin introuvable" });
      }

      const { firstName, phone, email, password } = req.body;
      const hashedPassword = await AuthService.hashPassword(password);

      const user = userRepo.create({
        firstName,
        phone,
        email,
        password_hash: hashedPassword,
        role: "manager",
      });
      await userRepo.save(user);

      const manager = managerRepo.create({ user, admin });
      await managerRepo.save(manager);

      return res.status(201).json({ user, manager });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 4️⃣ Création Agent (Personal) par Manager
  async createAgent(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== "manager") {
        return res.status(403).json({
          error: "Seul un manager peut créer un agent",
        });
      }

      const userRepo = AppDataSource.getRepository(User);
      const personalRepo = AppDataSource.getRepository(Personal);
      const managerRepo = AppDataSource.getRepository(Manager);

      const manager = await managerRepo.findOne({
        where: { user: { user_id: req.user.id } },
      });
      if (!manager) {
        return res.status(404).json({ error: "Manager introuvable" });
      }

      const { firstName, phone, email, password } = req.body;
      const hashedPassword = await AuthService.hashPassword(password);

      const user = userRepo.create({
        firstName,
        phone,
        email,
        password_hash: hashedPassword,
        role: "personal",
      });
      await userRepo.save(user);

      const personal = personalRepo.create({ user, manager });
      await personalRepo.save(personal);

      return res.status(201).json({ user, personal });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },
};
