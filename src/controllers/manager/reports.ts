import { Request, Response } from "express";
import { ManagerStatsService } from "../../services/ManagerStatsService";
import { AuthRequest } from "../../middleware/authRequest";

export class ManagerStatsController {
  static async stats(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const { date } = req.query;
      const stats = await ManagerStatsService.getStats(user, date as string);

      return res.status(200).json(stats);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
