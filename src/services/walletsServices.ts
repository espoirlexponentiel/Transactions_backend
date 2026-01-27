// src/services/walletsService.ts
import { AppDataSource } from "../data-source";
import { Wallet } from "../entities/Wallet";

export const WalletsService = {
  /**
   * Récupérer les wallets d’une agence par son ID
   */
  async getWalletsByAgency(agencyId: number) {
    const walletRepo = AppDataSource.getRepository(Wallet);

    const wallets = await walletRepo.find({
      where: { agency: { agency_id: agencyId } },
      relations: ["network"], // 🔹 inclure le réseau lié
    });

    if (!wallets || wallets.length === 0) {
      throw new Error("Aucun wallet trouvé pour cette agence");
    }

    // On formate la réponse pour n’envoyer que les infos utiles
    return wallets.map((wallet) => ({
      id: wallet.wallet_id,
      balance: wallet.balance,
      network: wallet.network.name, // 🔹 nom du réseau
    }));
  },
};
