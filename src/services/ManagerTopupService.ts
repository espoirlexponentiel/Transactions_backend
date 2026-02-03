import { AppDataSource } from "../data-source";
import { Transaction } from "../entities/Transaction";
import { Manager } from "../entities/Manager";
import { UserRole } from "../types/auth";
import { Between } from "typeorm";

interface AuthUser {
  id: number;
  role: UserRole;
}

export class ManagerTopupService {
  static async getTopupsByAgency(user: AuthUser, date?: string) {
    if (user.role !== "manager") {
      throw new Error("Seul un manager peut consulter ses topups");
    }

    const managerRepo = AppDataSource.getRepository(Manager);
    const transactionRepo = AppDataSource.getRepository(Transaction);

    const manager = await managerRepo.findOne({
      where: { user: { user_id: user.id } },
    });
    if (!manager) throw new Error("Manager introuvable");

    // 🔹 Déterminer la date cible
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // 🔹 Récupérer toutes les transactions de type "topup" des agences du manager
    const transactions = await transactionRepo.find({
      where: {
        wallet: { agency: { manager: { manager_id: manager.manager_id } } },
        type: "topup",
        created_at: Between(startOfDay, endOfDay),
      },
      relations: ["wallet", "wallet.agency"],
    });

    // 🔹 Regrouper par agence
    const byAgency: Record<string, any[]> = {};
    for (const tx of transactions) {
      const agencyName = tx.wallet.agency.name;
      if (!byAgency[agencyName]) {
        byAgency[agencyName] = [];
      }
      byAgency[agencyName].push({
        amount: tx.amount,
        date: tx.created_at,
        ussd_code: tx.ussdCode,
      });
    }

    return {
      date: startOfDay.toISOString().split("T")[0],
      agencies: byAgency,
    };
  }
}
