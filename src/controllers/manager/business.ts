import { Response } from "express";
import { BusinessService } from "../../services/businessServices";
import { AuthRequest } from "../../middleware/authRequest";

// Types pour ton body et params
interface CreateBusinessBody {
  name: string;
}

interface UpdateBusinessBody {
  name?: string;
}

interface BusinessParams {
  id: string;
}

export const BusinessController = {
  // ✅ Créer un business
  async create(req: AuthRequest<CreateBusinessBody>, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Utilisateur non authentifié" });

      const { name } = req.body;

      // ✅ Utilise le manager connecté via req.user.id
      const business = await BusinessService.createBusiness(name, req.user.id);
      res.status(201).json(business);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  // ✅ Récupérer tous les business
  async getAll(req: AuthRequest, res: Response) {
    const businesses = await BusinessService.getAllBusinesses();
    res.json(businesses);
  },

  // ✅ Récupérer un business par ID
  async getOne(req: AuthRequest<any, BusinessParams>, res: Response) {
    const businessId = Number(req.params.id);
    if (isNaN(businessId)) return res.status(400).json({ error: "ID invalide" });

    const business = await BusinessService.getBusinessById(businessId);
    res.json(business);
  },

  // ✅ Modifier un business
  async update(req: AuthRequest<UpdateBusinessBody, BusinessParams>, res: Response) {
    try {
      const businessId = Number(req.params.id);
      if (isNaN(businessId)) return res.status(400).json({ error: "ID invalide" });

      const business = await BusinessService.updateBusiness(businessId, req.body);
      res.json(business);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  // ✅ Supprimer un business
  async delete(req: AuthRequest<{}, BusinessParams>, res: Response) {
    try {
      const businessId = Number(req.params.id);
      if (isNaN(businessId)) return res.status(400).json({ error: "ID invalide" });

      const result = await BusinessService.deleteBusiness(businessId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
};
