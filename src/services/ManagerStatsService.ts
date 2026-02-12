import { AppDataSource } from "../data-source";
import { Transaction } from "../entities/Transaction";
import { Manager } from "../entities/Manager";
import { UserRole } from "../types/auth";
import { Between } from "typeorm";

interface AuthUser {
  id: number;
  role: UserRole;
}

export class ManagerStatsService {
  static async getStats(user: AuthUser, date?: string) {
    if (user.role !== "manager") {
      throw new Error("Seul un manager peut consulter ses statistiques");
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

    // 🔹 Récupérer toutes les transactions des agences du manager
    const transactions = await transactionRepo.find({
      where: {
        wallet: { agency: { manager: { manager_id: manager.manager_id } } },
        created_at: Between(startOfDay, endOfDay),
        status: "success",
      },
      relations: ["wallet", "wallet.agency", "wallet.network"],
    });

    // 🔹 Calcul des stats
    let depositTotal = 0;
    let withdrawTotal = 0;
    const byAgency: Record<string, { deposit: number; withdraw: number }> = {};
    const byNetwork: Record<string, { deposit: number; withdraw: number }> = {};

    for (const tx of transactions) {
      const agencyName = tx.wallet.agency.name;
      const networkName = tx.wallet.network.name;

      if (!byAgency[agencyName]) {
        byAgency[agencyName] = { deposit: 0, withdraw: 0 };
      }
      if (!byNetwork[networkName]) {
        byNetwork[networkName] = { deposit: 0, withdraw: 0 };
      }

      if (tx.type === "deposit") {
        depositTotal += tx.amount;
        byAgency[agencyName].deposit += tx.amount;
        byNetwork[networkName].deposit += tx.amount;
      } else if (tx.type === "withdraw") {
        withdrawTotal += tx.amount;
        byAgency[agencyName].withdraw += tx.amount;
        byNetwork[networkName].withdraw += tx.amount;
      }
    }

    return {
      date: startOfDay.toISOString().split("T")[0],
      totals: { deposit: depositTotal, withdraw: withdrawTotal },
      byAgency,
      byNetwork,
    };
  }
}
