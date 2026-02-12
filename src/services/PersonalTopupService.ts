import { AppDataSource } from "../data-source";
import { Transaction } from "../entities/Transaction";
import { Personal } from "../entities/Personal";
import { Between } from "typeorm";
import { AgencyPersonal } from "../entities/AgencyPersonal";

export class PersonalTopupService {
  static async getTopupsByAgency(userId: number, agencyId: number, date?: string) {
    const personalRepo = AppDataSource.getRepository(Personal);
    const transactionRepo = AppDataSource.getRepository(Transaction);
    const apRepo = AppDataSource.getRepository(AgencyPersonal);

    // 🔹 Récupérer le personal connecté
    const personal = await personalRepo.findOne({
      where: { user: { user_id: userId } },
      relations: ["user"], // pour récupérer son nom si besoin
    });
    if (!personal) throw new Error("Personal introuvable");

    // 🔹 Vérifier que le personal est bien lié à l’agence donnée
    const agencyPersonal = await apRepo.findOne({
      where: {
        personal: { personal_id: personal.personal_id },
        agency: { agency_id: agencyId },
      },
      relations: ["agency"],
    });
    if (!agencyPersonal) throw new Error("Personal non lié à l'agence");

    // 🔹 Construire la clause de filtrage
    let whereClause: any = {
      agency_personal: { personal: { personal_id: personal.personal_id } },
      type: "topup",
      status: "success", // uniquement les topups réussis
    };

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      whereClause.created_at = Between(startOfDay, endOfDay);
    }

    // 🔹 Récupérer les transactions
    const transactions = await transactionRepo.find({
      where: whereClause,
      relations: ["wallet", "wallet.network"],
      order: { created_at: "DESC" },
    });

    return transactions;
  }
}
