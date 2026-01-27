import { AppDataSource } from "../data-source";
import { Agency } from "../entities/Agency";
import { Business } from "../entities/Business";
import { Country } from "../entities/Country";
import { Manager } from "../entities/Manager";
import { Wallet } from "../entities/Wallet";
import { Network } from "../entities/Network";

export const AgenciesService = {
  /**
   * Créer une agence avec wallets liés au business et aux networks
   * ✅ Utilise le manager connecté
   */
  async createAgency(
    name: string,
    businessId: number,
    countryId: number,
    managerUserId: number
  ) {
    const businessRepo = AppDataSource.getRepository(Business);
    const countryRepo = AppDataSource.getRepository(Country);
    const managerRepo = AppDataSource.getRepository(Manager);
    const agencyRepo = AppDataSource.getRepository(Agency);
    const walletRepo = AppDataSource.getRepository(Wallet);
    const networkRepo = AppDataSource.getRepository(Network);

    // Récupérer le manager connecté
    const manager = await managerRepo.findOne({
      where: { user: { user_id: managerUserId } },
    });
    if (!manager) throw new Error("Manager introuvable");

    // Vérifier que le business appartient à ce manager
    const business = await businessRepo.findOne({
      where: { business_id: businessId, manager: { manager_id: manager.manager_id } },
    });
    if (!business) throw new Error("Le business n'existe pas ou ne vous appartient pas");

    // Récupérer le pays
    const country = await countryRepo.findOne({
      where: { country_id: countryId },
      relations: ["networks"],
    });
    if (!country) throw new Error("Country introuvable");

    // ✅ Création de l’agence
    const agency = agencyRepo.create({ name, business, country, manager });
    await agencyRepo.save(agency);

    // ✅ Création des wallets liés à l’agence et au business
    const networks = await networkRepo.find({ where: { country: { country_id: countryId } } });
    const wallets = networks.map((network) =>
      walletRepo.create({
        balance: 0,
        agency,
        business,
        network,
      })
    );
    await walletRepo.save(wallets);

    return agencyRepo.findOne({
      where: { agency_id: agency.agency_id },
      relations: [
        "wallets",
        "wallets.network",
        "wallets.business",
        "business",
        "country",
        "manager",
      ],
    });
  },

  /**
   * Récupérer toutes les agences
   */
  async getAllAgencies() {
    const agencyRepo = AppDataSource.getRepository(Agency);
    return agencyRepo.find({
      relations: [
        "wallets",
        "wallets.network",
        "wallets.business",
        "business",
        "country",
        "manager",
      ],
    });
  },

  /**
   * Récupérer une agence par ID
   */
  async getAgencyById(id: number) {
    const agencyRepo = AppDataSource.getRepository(Agency);
    const agency = await agencyRepo.findOne({
      where: { agency_id: id },
      relations: [
        "wallets",
        "wallets.network",
        "wallets.business",
        "business",
        "country",
        "manager",
      ],
    });

    if (!agency) throw new Error("Agence introuvable");
    return agency;
  },

  /**
   * Modifier une agence
   */
  async updateAgency(id: number, data: Partial<Agency>) {
    const agencyRepo = AppDataSource.getRepository(Agency);
    const agency = await agencyRepo.findOne({ where: { agency_id: id } });
    if (!agency) throw new Error("Agence introuvable");

    agencyRepo.merge(agency, data);
    await agencyRepo.save(agency);

    return agencyRepo.findOne({
      where: { agency_id: id },
      relations: [
        "wallets",
        "wallets.network",
        "wallets.business",
        "business",
        "country",
        "manager",
      ],
    });
  },

  /**
   * Supprimer une agence
   */
  async deleteAgency(id: number) {
    const agencyRepo = AppDataSource.getRepository(Agency);
    const agency = await agencyRepo.findOne({ where: { agency_id: id } });
    if (!agency) throw new Error("Agence introuvable");

    await agencyRepo.remove(agency);
    return { message: "Agence supprimée" };
  },


/** * Récupérer toutes les agences du manager connecté (via token) */ 
async getAgenciesByManager(managerUserId: number) { 
  const agencyRepo = AppDataSource.getRepository(Agency); 
  const managerRepo = AppDataSource.getRepository(Manager);

  // Vérifier que le manager existe 
  const manager = await managerRepo.findOne({ 
    where: { user: { user_id: managerUserId } }, 
  }); 
  if (!manager) throw new Error("Manager introuvable"); 
  
  // Récupérer les agences liées à ce manager 
  return agencyRepo.find({ 
    where: { manager: { manager_id: manager.manager_id } }, 
    relations: [ 
      "wallets", 
      "wallets.network", 
      "wallets.business", 
      "business", 
      "country", 
      "manager", 
    ], 
  }); 
},
};
