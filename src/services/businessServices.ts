import { AppDataSource } from "../data-source";
import { Business } from "../entities/Business";
import { Manager } from "../entities/Manager";

export const BusinessService = {
  /**
   * Créer un business et l'affecter au manager connecté
   */
  async createBusiness(name: string, userId: number) {
    const managerRepo = AppDataSource.getRepository(Manager);
    const businessRepo = AppDataSource.getRepository(Business);

    // Cherche le manager via la relation User
    const manager = await managerRepo.findOne({
      where: { user: { user_id: userId } },
    });
    if (!manager) throw new Error("Manager introuvable");

    const business = businessRepo.create({ name, manager });
    await businessRepo.save(business);

    // Retour complet avec relations
    return businessRepo.findOne({
      where: { business_id: business.business_id },
      relations: ["manager", "agencies"],
    });
  },

  /**
   * Récupérer tous les business
   */
  async getAllBusinesses() {
    const businessRepo = AppDataSource.getRepository(Business);
    return businessRepo.find({ relations: ["manager", "agencies"] });
  },

  /**
   * Récupérer un business par son ID
   */
  async getBusinessById(id: number) {
    const businessRepo = AppDataSource.getRepository(Business);
    const business = await businessRepo.findOne({
      where: { business_id: id },
      relations: ["manager", "agencies"],
    });

    if (!business) throw new Error("Business introuvable");
    return business;
  },

  /**
   * Modifier un business
   */
  async updateBusiness(id: number, data: Partial<Business>) {
    const businessRepo = AppDataSource.getRepository(Business);
    const business = await businessRepo.findOne({ where: { business_id: id } });

    if (!business) throw new Error("Business introuvable");

    businessRepo.merge(business, data);
    await businessRepo.save(business);

    return businessRepo.findOne({
      where: { business_id: id },
      relations: ["manager", "agencies"],
    });
  },

  /**
   * Supprimer un business
   */
  async deleteBusiness(id: number) {
    const businessRepo = AppDataSource.getRepository(Business);
    const business = await businessRepo.findOne({ where: { business_id: id } });

    if (!business) throw new Error("Business introuvable");

    await businessRepo.remove(business);
    return { message: "Business supprimé" };
  },

  /**
 * Récupérer les business du manager connecté
 */
async getBusinessesByManager(userId: number) {
  const managerRepo = AppDataSource.getRepository(Manager);
  const businessRepo = AppDataSource.getRepository(Business);

  // 🔹 Vérifier que le manager existe via son user_id
  const manager = await managerRepo.findOne({
    where: { user: { user_id: userId } },
    relations: ["user"],
  });
  if (!manager) throw new Error("Manager introuvable");

  // 🔹 Récupérer les businesses liés à ce manager
  return businessRepo.find({
    where: { manager: { manager_id: manager.manager_id } },
    relations: ["manager", "agencies"],
    order: { business_id: "ASC" },
  });
}

};
