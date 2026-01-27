import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { Admin } from "./Admin";
import { Personal } from "./Personal";
import { Business } from "./Business";
import { Agency } from "./Agency";
import { AgencyPersonal } from "./AgencyPersonal"; // ✅ ajouté

@Entity("managers")
export class Manager {
  @PrimaryGeneratedColumn({ name: "manager_id" })
  manager_id!: number;

  // ✅ Lien vers la table users (informations de connexion)
  @ManyToOne(() => User)
  user!: User;

  // ✅ Lien vers l’admin qui a créé ce manager
  @ManyToOne(() => Admin, (admin) => admin.managers, { nullable: true })
  admin?: Admin;

  // ✅ Relation inverse : un manager peut avoir plusieurs agents
  @OneToMany(() => Personal, (personal) => personal.manager)
  personals!: Personal[];

  // ✅ Relation inverse : un manager peut avoir plusieurs businesses
  @OneToMany(() => Business, (business) => business.manager)
  businesses!: Business[];

  // ✅ Relation inverse : un manager peut créer plusieurs agences
  @OneToMany(() => Agency, (agency) => agency.manager)
  agencies!: Agency[];

  // ✅ Relation inverse : un manager peut affecter plusieurs personals à des agences
  @OneToMany(() => AgencyPersonal, (ap) => ap.manager)
  agencyPersonals!: AgencyPersonal[];

  @CreateDateColumn()
  created_at!: Date;
}
