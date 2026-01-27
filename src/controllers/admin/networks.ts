import { Response } from "express";
import { Country, Network } from "../../entities";
import { AppDataSource } from "../../data-source";
import { AuthRequest } from "../../middleware/authRequest";

// Body pour création d'un réseau
interface CreateNetworkBody {
  name: string;
  countryId: number;
}

// Params pour suppression
interface DeleteNetworkParams {
  id: string;
}

export const NetworkController = {
  // ✅ Créer un réseau
  async create(req: AuthRequest<CreateNetworkBody>, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Utilisateur non authentifié" });

      const { name, countryId } = req.body;
      const countryRepo = AppDataSource.getRepository(Country);
      const networkRepo = AppDataSource.getRepository(Network);

      const country = await countryRepo.findOneBy({ country_id: countryId });
      if (!country) return res.status(404).json({ error: "Country introuvable" });

      const network = networkRepo.create({ name, country });
      await networkRepo.save(network);

      res.status(201).json(network);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // ✅ Récupérer tous les réseaux
  async getAll(_req: AuthRequest, res: Response) {
    const repo = AppDataSource.getRepository(Network);
    const networks = await repo.find({ relations: ["country"] });
    res.json(networks);
  },

  // ✅ Supprimer un réseau
  async delete(req: AuthRequest<any, DeleteNetworkParams>, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Utilisateur non authentifié" });

      const repo = AppDataSource.getRepository(Network);
      const id = Number(req.params.id);

      if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

      await repo.delete(id);
      res.json({ message: "Network supprimé" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
};
