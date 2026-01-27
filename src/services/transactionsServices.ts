import { AppDataSource } from "../data-source";
import { Deposit } from "../entities/Deposit";
import { Withdraw } from "../entities/Withdraw";
import { Transaction } from "../entities/Transaction";
import { Wallet } from "../entities/Wallet";
import { AgencyPersonal } from "../entities/AgencyPersonal";
import { Personal } from "../entities/Personal";
import { Manager } from "../entities/Manager";
import { UserRole } from "../types/auth";

interface DepositPayload {
  walletId: number;
  amount: number;
  clientPhone: string;
  clientName?: string;
}

interface WithdrawPayload {
  walletId: number;
  amount: number;
  clientPhone: string;
  clientName?: string;
}

interface TopupPayload {
  walletId: number;
  amount: number;
  secretCode?: number;
}

interface AuthUser {
  id: number;
  role: UserRole;
}

export const TransactionsService = {
  // ================================
  // 🔹 DEPOT (personal → client)
  // ================================
  async createDeposit(payload: DepositPayload, user: AuthUser) {
    if (user.role !== "personal") throw new Error("Seul un personal peut effectuer un dépôt");

    const { walletId, amount, clientPhone, clientName } = payload;
    if (amount <= 0) throw new Error("Montant invalide");

    const walletRepo = AppDataSource.getRepository(Wallet);
    const depositRepo = AppDataSource.getRepository(Deposit);
    const transactionRepo = AppDataSource.getRepository(Transaction);
    const apRepo = AppDataSource.getRepository(AgencyPersonal);
    const personalRepo = AppDataSource.getRepository(Personal);

    const wallet = await walletRepo.findOne({
      where: { wallet_id: walletId },
      relations: ["agency", "network"],
    });
    if (!wallet) throw new Error("Wallet introuvable");
    if (wallet.balance < amount) throw new Error("Solde insuffisant");

    const personal = await personalRepo.findOne({
      where: { user: { user_id: user.id } },
    });
    if (!personal) throw new Error("Personal introuvable");

    const agencyPersonal = await apRepo.findOne({
      where: {
        personal: { personal_id: personal.personal_id },
        agency: { agency_id: wallet.agency.agency_id },
      },
    });
    if (!agencyPersonal) throw new Error("Personal non lié à l'agence");

    // 🔒 Débit optimiste
    wallet.balance -= amount;
    await walletRepo.save(wallet);

    const secret = wallet.secretCode?.toString() ?? "0000";
    const network = wallet.network.name.toLowerCase();
    let ussdCode: string | undefined;

    if (network === "yas") ussdCode = `*145*1*${amount}*${clientPhone}*${secret}#`;
    else if (network === "moov africa") ussdCode = `*152*1*1*${clientPhone}*${amount}*${secret}#`;

    // Création transaction
    const transaction = transactionRepo.create({
      wallet,
      agency_personal: agencyPersonal,
      type: "deposit",
      amount,
      clientPhone,
      clientName,
      status: "pending",
      ussdCode,
    });
    await transactionRepo.save(transaction);

    // Création dépôt lié
    const deposit = depositRepo.create({
      wallet,
      agency_personal: agencyPersonal,
      transaction,
      amount,
      clientPhone,
      clientName,
      status: "pending",
    });
    await depositRepo.save(deposit);

    return { transaction, deposit, wallet };
  },

  // ================================
  // 🔹 RETRAIT (client → personal)
  // ================================
  async createWithdraw(payload: WithdrawPayload, user: AuthUser) {
    if (user.role !== "personal") throw new Error("Seul un personal peut effectuer un retrait");

    const { walletId, amount, clientPhone, clientName } = payload;
    if (amount <= 0) throw new Error("Montant invalide");

    const walletRepo = AppDataSource.getRepository(Wallet);
    const withdrawRepo = AppDataSource.getRepository(Withdraw);
    const transactionRepo = AppDataSource.getRepository(Transaction);
    const apRepo = AppDataSource.getRepository(AgencyPersonal);
    const personalRepo = AppDataSource.getRepository(Personal);

    const wallet = await walletRepo.findOne({
      where: { wallet_id: walletId },
      relations: ["agency", "network"],
    });
    if (!wallet) throw new Error("Wallet introuvable");

    const personal = await personalRepo.findOne({
      where: { user: { user_id: user.id } },
    });
    if (!personal) throw new Error("Personal introuvable");

    const agencyPersonal = await apRepo.findOne({
      where: {
        personal: { personal_id: personal.personal_id },
        agency: { agency_id: wallet.agency.agency_id },
      },
    });
    if (!agencyPersonal) throw new Error("Personal non lié à l'agence");

    // 🔒 Crédit optimiste
    wallet.balance += amount;
    await walletRepo.save(wallet);

    const secret = wallet.secretCode?.toString() ?? "0000";
    const network = wallet.network.name.toLowerCase();
    let ussdCode: string | undefined;

    if (network === "moov africa") ussdCode = `*152*2*1*${clientPhone}*${amount}*${secret}#`;
    else if (network === "yas") ussdCode = `YAS-RETRAIT: ${clientPhone} / ${amount} / ${secret}`;

    // Création transaction
    const transaction = transactionRepo.create({
      wallet,
      agency_personal: agencyPersonal,
      type: "withdraw",
      amount,
      clientPhone,
      clientName,
      status: "pending",
      ussdCode,
    });
    await transactionRepo.save(transaction);

    // Création retrait lié
    const withdraw = withdrawRepo.create({
      wallet,
      agency_personal: agencyPersonal,
      transaction,
      amount,
      clientPhone,
      clientName,
      status: "pending",
    });
    await withdrawRepo.save(withdraw);

    return { transaction, withdraw, wallet };
  },

  // ================================
  // 🔹 TOPUP (manager → wallet)
  // ================================
  async createTopup(payload: TopupPayload, user: AuthUser) {
    if (user.role !== "manager") throw new Error("Seul un manager peut effectuer un topup");

    const { walletId, amount, secretCode } = payload;
    if (amount <= 0) throw new Error("Montant invalide");

    const walletRepo = AppDataSource.getRepository(Wallet);
    const transactionRepo = AppDataSource.getRepository(Transaction);
    const managerRepo = AppDataSource.getRepository(Manager);

    const wallet = await walletRepo.findOne({
      where: { wallet_id: walletId },
      relations: ["agency", "agency.manager", "network"],
    });
    if (!wallet) throw new Error("Wallet introuvable");

    const manager = await managerRepo.findOne({
      where: { user: { user_id: user.id } },
    });
    if (!manager) throw new Error("Manager introuvable");
    if (wallet.agency.manager.manager_id !== manager.manager_id)
      throw new Error("Manager non autorisé");

    // 🔒 Crédit optimiste
    wallet.balance += amount;
    if (secretCode !== undefined) wallet.secretCode = secretCode;
    await walletRepo.save(wallet);

    const secret = wallet.secretCode?.toString() ?? "0000";
    const ussdCode = `TOPUP-${wallet.network.name}-${amount}-${secret}`;

    const transaction = transactionRepo.create({
      wallet,
      amount,
      type: "topup",
      status: "pending",
      clientPhone: "N/A",
      clientName: "Manager",
      ussdCode,
    });
    await transactionRepo.save(transaction);

    return { transaction, wallet };
  },

  // ================================
  // 🔹 CONFIRM TRANSACTION
  // ================================
  async confirmTransaction(transaction_id: number, status: "success" | "failed", user: AuthUser) {
    if (user.role !== "personal") throw new Error("Seul un agent peut confirmer une transaction");

    const transactionRepo = AppDataSource.getRepository(Transaction);
    const walletRepo = AppDataSource.getRepository(Wallet);

    const transaction = await transactionRepo.findOne({
      where: { transaction_id },
      relations: ["wallet", "deposit", "withdraw"],
    });
    if (!transaction) throw new Error("Transaction introuvable");
    if (transaction.status !== "pending") throw new Error("Transaction déjà confirmée");

    transaction.status = status;

    // Gestion selon type
    if (transaction.type === "deposit" && transaction.deposit) {
      transaction.deposit.status = status;
      if (status === "failed") {
        transaction.wallet.balance += transaction.amount;
        await walletRepo.save(transaction.wallet);
      }
      await AppDataSource.getRepository(Deposit).save(transaction.deposit);
    }

    if (transaction.type === "withdraw" && transaction.withdraw) {
      transaction.withdraw.status = status;
      if (status === "failed") {
        transaction.wallet.balance -= transaction.amount;
        await walletRepo.save(transaction.wallet);
      }
      await AppDataSource.getRepository(Withdraw).save(transaction.withdraw);
    }

    // TOPUP pas de rollback
    await transactionRepo.save(transaction);

    return { transaction, wallet: transaction.wallet };
  },

  // ================================
  // 🔹 RESEND USSD
  // ================================
  async resendUSSD(transactionId: number) {
    const transactionRepo = AppDataSource.getRepository(Transaction);
    const transaction = await transactionRepo.findOne({ where: { transaction_id: transactionId } });
    if (!transaction) throw new Error("Transaction introuvable");
    if (transaction.status !== "pending") throw new Error("USSD non renvoyable");

    return { ussdCode: transaction.ussdCode, transaction };
  },

  // ================================
  // 🔹 HISTORIQUE DU PERSONAL
  // ================================
  async getPersonalTransactions(user: AuthUser) {
    if (user.role !== "personal") throw new Error("Seul un personal peut consulter son historique");

    const personalRepo = AppDataSource.getRepository(Personal);
    const transactionRepo = AppDataSource.getRepository(Transaction);

    const personal = await personalRepo.findOne({ where: { user: { user_id: user.id } } });
    if (!personal) throw new Error("Personal introuvable");

    return transactionRepo.find({
      where: { agency_personal: { personal: { personal_id: personal.personal_id } } },
      relations: ["wallet", "deposit", "withdraw"],
      order: { created_at: "DESC" },
    });
  },
};
