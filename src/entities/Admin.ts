import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { User } from "./User";
import { Manager } from "./Manager";

@Entity("admins")
export class Admin {
  @PrimaryGeneratedColumn({ name: "admin_id" })
  admin_id!: number;

  // ✅ Lien vers la table users (compte de connexion de l’admin)
  @ManyToOne(() => User)
  user!: User;

  // ✅ Relation inverse : un admin peut créer plusieurs managers
  @OneToMany(() => Manager, manager => manager.admin)
  managers!: Manager[];

  @CreateDateColumn()
  created_at!: Date;
}
