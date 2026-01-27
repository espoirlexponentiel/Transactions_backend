import { Response } from "express";
import { Country } from "../../entities";
import { AppDataSource } from "../../data-source";
import { AuthRequest } from "../../middleware/authRequest";

// Body pour la création d'un pays
interface CreateCountryBody {
  name: string;
}

// Params pour suppression
interface DeleteCountryParams {
  id: string;
}

export const CountryController = {
  // ✅ Créer un pays
  async create(req: AuthRequest<CreateCountryBody>, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Utilisateur non authentifié" });

      const { name } = req.body;
      const repo = AppDataSource.getRepository(Country);

      const country = repo.create({ name });
      await repo.save(country);

      res.status(201).json(country);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // ✅ Récupérer tous les pays
  async getAll(_req: AuthRequest, res: Response) {
    const repo = AppDataSource.getRepository(Country);
    const countries = await repo.find({ relations: ["networks", "agencies"] });
    res.json(countries);
  },

  // ✅ Supprimer un pays
  async delete(req: AuthRequest<any, DeleteCountryParams>, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Utilisateur non authentifié" });

      const repo = AppDataSource.getRepository(Country);
      const id = Number(req.params.id);

      if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

      await repo.delete(id);
      res.json({ message: "Country supprimé" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
};
