import { AppDataSource } from "../data-source";
import { Personal } from "../entities/Personal";
import { Agency } from "../entities/Agency";
import { AgencyPersonal } from "../entities/AgencyPersonal";
import { Manager } from "../entities/Manager";

export const PersonalsService = {
  // ✅ Affecter un Personal à une Agency (manager propriétaire uniquement)
  async assignPersonalToAgency(
    personalId: number,
    agencyId: number,
    managerUserId: number // 🔐 vient du token
  ) {
    const personalRepo = AppDataSource.getRepository(Personal);
    const agencyRepo = AppDataSource.getRepository(Agency);
    const agencyPersonalRepo = AppDataSource.getRepository(AgencyPersonal);
    const managerRepo = AppDataSource.getRepository(Manager);

    // 🔹 Récupérer le manager connecté via user_id
    const manager = await managerRepo.findOne({
      where: { user: { user_id: managerUserId } },
      relations: ["user"],
    });
    if (!manager) throw new Error("Manager introuvable");

    // 🔹 Récupérer le personal
    const personal = await personalRepo.findOne({
      where: { personal_id: personalId },
      relations: ["manager", "user"],
    });
    if (!personal) throw new Error("Personal introuvable");

    // 🔹 Récupérer l’agence
    const agency = await agencyRepo.findOne({
      where: { agency_id: agencyId },
      relations: ["manager"],
    });
    if (!agency) throw new Error("Agence introuvable");

    // 🔐 Sécurité : même manager propriétaire
    if (
      personal.manager.manager_id !== manager.manager_id ||
      agency.manager.manager_id !== manager.manager_id
    ) {
      throw new Error(
        "Accès refusé : ce personal ou cette agence ne vous appartient pas"
      );
    }

    // 🔹 Vérifier si déjà affecté
    const existing = await agencyPersonalRepo.findOne({
      where: {
        personal: { personal_id: personalId },
        agency: { agency_id: agencyId },
      },
    });
    if (existing) throw new Error("Ce personal est déjà affecté à cette agence");

    // ✅ Créer l’affectation
    const agencyPersonal = agencyPersonalRepo.create({
      personal,
      agency,
      manager,
    });
    await agencyPersonalRepo.save(agencyPersonal);

    return agencyPersonalRepo.findOne({
      where: { id: agencyPersonal.id },
      relations: ["personal", "personal.user", "agency", "manager"],
    });
  },

  // ✅ Récupérer les personals d’une agence (manager propriétaire)
  async getPersonalsByAgency(agencyId: number, managerUserId: number) {
    const agencyRepo = AppDataSource.getRepository(Agency);
    const repo = AppDataSource.getRepository(AgencyPersonal);

    // 🔹 Vérifier que l’agence appartient au manager
    const agency = await agencyRepo.findOne({
      where: {
        agency_id: agencyId,
        manager: { user: { user_id: managerUserId } },
      },
    });
    if (!agency) {
      throw new Error("Accès refusé à cette agence");
    }

    return repo.find({
      where: { agency: { agency_id: agencyId } },
      relations: ["personal", "personal.user", "agency", "manager"],
      order: { id: "ASC" },
    });
  },

  // ✅ Retirer un Personal d’une Agency (manager propriétaire)
  async unassignPersonalFromAgency(
    personalId: number,
    agencyId: number,
    managerUserId: number
  ) {
    const repo = AppDataSource.getRepository(AgencyPersonal);

    const relation = await repo.findOne({
      where: {
        personal: { personal_id: personalId },
        agency: { agency_id: agencyId },
        manager: { user: { user_id: managerUserId } },
      },
      relations: ["manager", "manager.user"],
    });

    if (!relation) {
      throw new Error("Affectation introuvable ou non autorisée");
    }

    await repo.remove(relation);
    return { message: "Affectation supprimée" };
  },
};
