import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { User } from "./User";
import { Manager } from "./Manager";
import { AgencyPersonal } from "./AgencyPersonal";

@Entity("personals")
export class Personal {
  @PrimaryGeneratedColumn({ name: "personal_id" })
  personal_id!: number;

  // ✅ Lien vers le compte utilisateur de l’agent
  @ManyToOne(() => User, { eager: true })
  user!: User;

  // ✅ Lien vers le manager qui a créé cet agent
  @ManyToOne(() => Manager, manager => manager.personals)
  manager!: Manager;

  // ✅ Affectations multiples via la table pivot
  @OneToMany(() => AgencyPersonal, agencyPersonal => agencyPersonal.personal)
  agencyPersonals!: AgencyPersonal[];

  @CreateDateColumn()
  created_at!: Date;
}
