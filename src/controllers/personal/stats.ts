import { Response } from "express";
import { AuthRequest } from "../../middleware/authRequest";
import { StatsService } from "../../services/statsServices";

export class StatsController {
  static async dailyStats(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const { date } = req.query;

      const stats = await StatsService.getDailyStats(user, date as string);

      return res.status(200).json(stats);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
