import { Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Admin } from "../entities/Admin";
import { Manager } from "../entities/Manager";
import { Personal } from "../entities/Personal";
import { AuthService } from "../services/authService";
import { AuthRequest } from "../middleware/authRequest";
import { Country } from "../entities/Country";
import { BusinessService } from "../services/businessServices";
import { AgenciesService } from "../services/agenciesServices";
import { PersonalsService } from "../services/personalsService";

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
    const personalRepo = AppDataSource.getRepository(Personal);
    const { phone, password } = req.body;

    const user = await userRepo.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    const valid = await AuthService.comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    // 🔹 Si l'utilisateur est un "personal", on récupère son agence assignée
    let agencyId: number | undefined = undefined;
    let agencyName: string | undefined = undefined;

    if (user.role === "personal") {
      const personal = await personalRepo.findOne({
        where: { user: { user_id: user.user_id } },
        relations: ["agencyPersonals", "agencyPersonals.agency"],
      });

      if (personal && personal.agencyPersonals?.length > 0) {
        const agency = personal.agencyPersonals[0].agency;
        agencyId = agency.agency_id;
        agencyName = agency.name;
      }
    }

    const token = AuthService.generateToken({
      id: user.user_id,
      role: user.role,
      name: user.firstName,
      agencyId,
    });

    return res.json({
      token,
      role: user.role,
      name: user.firstName,
      agencyId,
      agency: agencyId ? { agency_id: agencyId, name: agencyName } : null,
    });
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
  // 5️⃣ Signup solo : crée un agent indépendant avec son business + agence
async signup(req: AuthRequest, res: Response) {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const managerRepo = AppDataSource.getRepository(Manager);
    const personalRepo = AppDataSource.getRepository(Personal);
    const countryRepo = AppDataSource.getRepository(Country);

    const { firstName, phone, email, password, businessName } = req.body;

    if (!firstName || !phone || !email || !password || !businessName) {
      return res.status(400).json({
        error: "firstName, phone, email, password et businessName sont requis",
      });
    }

    // 1. Créer l'utilisateur avec le rôle "personal"
    const hashedPassword = await AuthService.hashPassword(password);
    const user = userRepo.create({
      firstName,
      phone,
      email,
      password_hash: hashedPassword,
      role: "personal",
    });
    await userRepo.save(user);

    // 2. Créer un Manager interne pour cet utilisateur (jamais exposé côté rôle/token)
    const manager = managerRepo.create({ user });
    await managerRepo.save(manager);

    // 3. Créer le Personal lié au même user et au même manager
    const personal = personalRepo.create({ user, manager });
    await personalRepo.save(personal);

    // 4. Créer le Business
    const business = await BusinessService.createBusiness(businessName, user.user_id);

    // 5. Récupérer le pays par défaut (Togo, déjà créé en base)
    const country = await countryRepo.findOne({ where: { name: "Togo" } });
    if (!country) {
      return res.status(500).json({
        error: "Le pays 'Togo' doit d'abord être créé en base (admin/countries)",
      });
    }

    // 6. Créer l'Agence liée au business
    const agency = await AgenciesService.createAgency(
      `${businessName} - Agence principale`,
      business!.business_id,
      country.country_id,
      user.user_id
    );

    // 7. Lier le Personal à cette Agence
    await PersonalsService.assignPersonalToAgency(
      personal.personal_id,
      agency!.agency_id,
      user.user_id
    );

    // 8. Générer directement le token (auto-login après inscription)
    const token = AuthService.generateToken({
      id: user.user_id,
      role: user.role,
      name: user.firstName,
      agencyId: agency!.agency_id,
    });

    return res.status(201).json({
      token,
      role: user.role,
      name: user.firstName,
      agencyId: agency!.agency_id,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
},
};
