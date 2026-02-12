import { AppDataSource } from "../data-source";
import { Transaction } from "../entities/Transaction";
import { Personal } from "../entities/Personal";
import { UserRole } from "../types/auth";
import { Between } from "typeorm";

interface AuthUser {
  id: number;
  role: UserRole;
}

export class StatsService {
  static async getDailyStats(user: AuthUser, date?: string) {
    if (user.role !== "personal") {
      throw new Error("Seul un personal peut consulter ses statistiques");
    }

    const personalRepo = AppDataSource.getRepository(Personal);
    const transactionRepo = AppDataSource.getRepository(Transaction);

    const personal = await personalRepo.findOne({
      where: { user: { user_id: user.id } },
    });
    if (!personal) throw new Error("Personal introuvable");

    // 🔹 Déterminer la date cible
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // 🔹 Récupérer toutes les transactions de la journée
    const transactions = await transactionRepo.find({
      where: {
        agency_personal: { personal: { personal_id: personal.personal_id } },
        created_at: Between(startOfDay, endOfDay),
        status: "success",
      },
      relations: ["wallet", "wallet.network"],
    });

    // 🔹 Calcul des stats
    let depositTotal = 0;
    let withdrawTotal = 0;
    const byNetwork: Record<string, { deposit: number; withdraw: number }> = {};

    for (const tx of transactions) {
      const networkName = tx.wallet.network.name;
      if (!byNetwork[networkName]) {
        byNetwork[networkName] = { deposit: 0, withdraw: 0 };
      }

      if (tx.type === "deposit") {
        depositTotal += tx.amount;
        byNetwork[networkName].deposit += tx.amount;
      } else if (tx.type === "withdraw") {
        withdrawTotal += tx.amount;
        byNetwork[networkName].withdraw += tx.amount;
      }
    }

    return {
      date: startOfDay.toISOString().split("T")[0],
      totals: {
        deposit: depositTotal,
        withdraw: withdrawTotal,
      },
      byNetwork,
    };
  }
}
