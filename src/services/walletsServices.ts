// src/services/walletsService.ts
import { AppDataSource } from "../data-source";
import { Wallet } from "../entities/Wallet";
import { Agency } from "../entities/Agency";
import { Manager } from "../entities/Manager";

export const WalletsService = {
  /**
   * Récupérer les wallets d’une agence par son ID
   */
  async getWalletsByAgency(agencyId: number) {
    const walletRepo = AppDataSource.getRepository(Wallet);

    const wallets = await walletRepo.find({
      where: { agency: { agency_id: agencyId } },
      relations: ["network"],
    });

    if (!wallets || wallets.length === 0) {
      throw new Error("Aucun wallet trouvé pour cette agence");
    }

    return wallets.map((wallet) => ({
      id: wallet.wallet_id,
      balance: wallet.balance,
      network: wallet.network.name,
    }));
  },

  /**
   * Récupérer tous les wallets du manager connecté, regroupés par agence
   */
  async getWalletsByManager(userId: number) {
    const agencyRepo = AppDataSource.getRepository(Agency);
    const managerRepo = AppDataSource.getRepository(Manager);

    // 🔹 Vérifier que le manager existe
    const manager = await managerRepo.findOne({
      where: { user: { user_id: userId } },
      relations: ["user"],
    });
    if (!manager) throw new Error("Manager introuvable");

    // 🔹 Récupérer toutes les agences du manager avec leurs wallets
    const agencies = await agencyRepo.find({
      where: { manager: { manager_id: manager.manager_id } },
      relations: ["wallets", "wallets.network"],
    });

    // 🔹 Formater la réponse
    return agencies.map((agency) => ({
      agency_id: agency.agency_id,
      name: agency.name,
      wallets: agency.wallets.map((wallet) => ({
        id: wallet.wallet_id,
        balance: wallet.balance,
        network: wallet.network.name,
      })),
    }));
  },
};
