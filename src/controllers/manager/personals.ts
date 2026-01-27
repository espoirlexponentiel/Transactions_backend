import { Response } from "express";
import { PersonalsService } from "../../services/personalsService";
import { AuthRequest } from "../../middleware/authRequest";

// Types pour les corps et params
interface AssignBody {
  personalId: number;
  agencyId: number;
}

interface UnassignBody {
  personalId: number;
  agencyId: number;
}

interface GetByAgencyParams {
  agencyId: string;
}

export const PersonalsController = {
  // ✅ Affecter un Personal à une Agency (manager propriétaire)
  async assign(req: AuthRequest<AssignBody>, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const { personalId, agencyId } = req.body;

      if (!personalId || !agencyId) {
        return res
          .status(400)
          .json({ error: "personalId et agencyId sont requis" });
      }

      const assignment = await PersonalsService.assignPersonalToAgency(
        personalId,
        agencyId,
        req.user.id // 🔐 user_id depuis le token
      );

      return res.status(201).json(assignment);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  // ✅ Récupérer les Personals d’une Agency (manager propriétaire)
  async getByAgency(
    req: AuthRequest<any, GetByAgencyParams>,
    res: Response
  ) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const agencyId = Number(req.params.agencyId);
      if (isNaN(agencyId)) {
        return res.status(400).json({ error: "agencyId invalide" });
      }

      const personals = await PersonalsService.getPersonalsByAgency(
        agencyId,
        req.user.id // 🔐 token
      );

      return res.json(personals);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  // ✅ Retirer un Personal d’une Agency (manager propriétaire)
  async unassign(req: AuthRequest<UnassignBody>, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const { personalId, agencyId } = req.body;

      if (!personalId || !agencyId) {
        return res
          .status(400)
          .json({ error: "personalId et agencyId sont requis" });
      }

      const result = await PersonalsService.unassignPersonalFromAgency(
        personalId,
        agencyId,
        req.user.id // 🔐 token
      );

      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },
};
