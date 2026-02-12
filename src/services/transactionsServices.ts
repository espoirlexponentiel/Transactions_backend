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

    // 🔒 Transaction DB
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Débit optimiste
      wallet.balance -= amount;
      await queryRunner.manager.save(wallet);

      const secret = wallet.secretCode?.toString() ?? "0000";
      const network = wallet.network.name.toLowerCase();

      let ussdCode = network === "yas" ? `*145*1*${amount}*${clientPhone}*${secret}#` : `*152*1*1*${clientPhone}*${amount}*${secret}#`;

      // Création transaction
      const transaction = queryRunner.manager.create(Transaction, {
        wallet,
        agency_personal: agencyPersonal,
        type: "deposit",
        amount,
        clientPhone,
        clientName,
        status: "pending",
        ussdCode,
      });
      await queryRunner.manager.save(transaction);

      if(!transaction.transaction_id){
        throw new Error("Erreur lors de la création de la transaction");
      }

      // Création dépôt lié
      const deposit = queryRunner.manager.create(Deposit, {
        wallet,
        agency_personal: agencyPersonal,
        transaction,
        amount,
        clientPhone,
        clientName,
        status: "pending",
      });
      await queryRunner.manager.save(deposit);

      if(!deposit.deposit_id){
        throw new Error("Erreur lors de la création du dépôt");
      }

      await queryRunner.commitTransaction();
      return { transaction, deposit, wallet };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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

    // 🔒 Transaction DB
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crédit optimiste
      wallet.balance += amount;
      await queryRunner.manager.save(wallet);

      const secret = wallet.secretCode?.toString() ?? "0000";
      const network = wallet.network.name.toLowerCase();
      let ussdCode: string | undefined;

      if (network === "moov africa") ussdCode = `*152*2*1*${clientPhone}*${amount}*${secret}#`;
      else if (network === "yas") ussdCode = `YAS-RETRAIT: ${clientPhone} / ${amount} / ${secret}`;

      // Création transaction
      const transaction = queryRunner.manager.create(Transaction, {
        wallet,
        agency_personal: agencyPersonal,
        type: "withdraw",
        amount,
        clientPhone,
        clientName,
        status: "pending",
        ussdCode,
      });
      await queryRunner.manager.save(transaction);

      // Création retrait lié
      const withdraw = queryRunner.manager.create(Withdraw, {
        wallet,
        agency_personal: agencyPersonal,
        transaction,
        amount,
        clientPhone,
        clientName,
        status: "pending",
      });
      await queryRunner.manager.save(withdraw);

      await queryRunner.commitTransaction();
      return { transaction, withdraw, wallet };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  },

  // ================================
  // 🔹 TOPUP (manager → wallet)
  // ================================
 async createTopup(payload: TopupPayload, user: AuthUser) {
  if (user.role !== "manager" && user.role !== "personal") {
    throw new Error("Seul un manager ou un personal peut effectuer un topup");
  }

  const { walletId, amount, secretCode } = payload;
  if (amount <= 0) throw new Error("Montant invalide");

  const walletRepo = AppDataSource.getRepository(Wallet);
  const transactionRepo = AppDataSource.getRepository(Transaction);
  const managerRepo = AppDataSource.getRepository(Manager);
  const personalRepo = AppDataSource.getRepository(Personal);
  const apRepo = AppDataSource.getRepository(AgencyPersonal);

  const wallet = await walletRepo.findOne({
    where: { wallet_id: walletId },
    relations: ["agency", "agency.manager", "network"],
  });
  if (!wallet) throw new Error("Wallet introuvable");

  let clientName = "";
  let agencyPersonal: AgencyPersonal | null = null;

  if (user.role === "manager") {
    const manager = await managerRepo.findOne({
      where: { user: { user_id: user.id } },
      relations: ["user"],
    });
    if (!manager) throw new Error("Manager introuvable");
    if (wallet.agency.manager.manager_id !== manager.manager_id) {
      throw new Error("Manager non autorisé");
    }
    clientName = manager.user.firstName;
  } else if (user.role === "personal") {
    const personal = await personalRepo.findOne({
      where: { user: { user_id: user.id } },
      relations: ["user"],
    });
    if (!personal) throw new Error("Personal introuvable");

    agencyPersonal = await apRepo.findOne({
      where: {
        personal: { personal_id: personal.personal_id },
        agency: { agency_id: wallet.agency.agency_id },
      },
      relations: ["agency"],
    });
    if (!agencyPersonal) throw new Error("Personal non lié à l'agence");

    clientName = personal.user.firstName;
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    wallet.balance += amount;
    if (secretCode !== undefined) wallet.secretCode = secretCode;
    await queryRunner.manager.save(wallet);

    const secret = wallet.secretCode?.toString() ?? "0000";
    const ussdCode = `TOPUP-${wallet.network.name}-${amount}-${secret}`;

    const transaction = queryRunner.manager.create(Transaction, {
      wallet,
      amount,
      type: "topup",
      status: "success", // considéré comme réussi
      clientPhone: "N/A",
      clientName,
      ussdCode,
      agencyPersonalId: agencyPersonal?.id  ?? null, // 🔹 lien ajouté si personal
    });
    await queryRunner.manager.save(transaction);

    await queryRunner.commitTransaction();
    return { transaction, wallet };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
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

    // 🔒 Transaction DB
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      transaction.status = status;

      // Gestion selon type
      if (transaction.type === "deposit" && transaction.deposit) {
        transaction.deposit.status = status;
        if (status === "failed") {
          transaction.wallet.balance += transaction.amount;
          await queryRunner.manager.save(transaction.wallet);
        }
        await queryRunner.manager.save(transaction.deposit);
      }

      if (transaction.type === "withdraw" && transaction.withdraw) {
        transaction.withdraw.status = status;
        if (status === "failed") {
          transaction.wallet.balance -= transaction.amount;
          await queryRunner.manager.save(transaction.wallet);
        }
        await queryRunner.manager.save(transaction.withdraw);
      }

      // TOPUP pas de rollback
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();
      return { transaction, wallet: transaction.wallet };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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
  async getPersonalTransactions( 
    user: AuthUser, 
    page: number = 1, 
    limit: number = 10, 
    type?: string, 
    network?: string 
  ) { 
    if (user.role !== "personal") { 
      throw new Error("Seul un personal peut consulter son historique"); 
    } 
    const personalRepo = AppDataSource.getRepository(Personal); 
    const transactionRepo = AppDataSource.getRepository(Transaction); 
    
    const personal = await personalRepo.findOne({ 
      where: { user: { user_id: user.id } }, 
    });
    if (!personal) throw new Error("Personal introuvable");

    const skip = (page - 1) * limit; 
    
    const query = transactionRepo
  .createQueryBuilder("transaction")
  .leftJoinAndSelect("transaction.wallet", "wallet")
  .leftJoinAndSelect("wallet.network", "network") // 🔹 récupérer le réseau
  .leftJoinAndSelect("transaction.deposit", "deposit")
  .leftJoinAndSelect("transaction.withdraw", "withdraw")
  .leftJoin("transaction.agency_personal", "agency_personal")
  .leftJoin("agency_personal.personal", "personal")
  .where("personal.personal_id = :personalId", { personalId: personal.personal_id })
  .andWhere("transaction.type IN (:...types)", { types: ["deposit", "withdraw"] })
  .orderBy("transaction.created_at", "DESC")
  .skip(skip)
  .take(limit);
 
    
  if (type) { 
    query.andWhere("transaction.type = :type", { type }); 
  } 
  
  if (network) { 
    query.andWhere("network.name = :network", { network }); 
  } 
  
  const [transactions, total] = await query.getManyAndCount(); 
  return { total, page, limit, transactions, }; }
};
