import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { Manager } from "./Manager";
import { Agency } from "./Agency";
import { Wallet } from "./Wallet";

@Entity("businesses")
export class Business {
  @PrimaryGeneratedColumn({ name: "business_id" })
  business_id!: number;

  @Column()
  name!: string;

  // ✅ Le manager propriétaire du business
  @ManyToOne(() => Manager, manager => manager.businesses, { onDelete: "CASCADE" })
  manager!: Manager;

  // ✅ Les agences rattachées à ce business
  @OneToMany(() => Agency, agency => agency.business)
  agencies!: Agency[];

  // ✅ Les wallets rattachés directement au business
  @OneToMany(() => Wallet, wallet => wallet.business)
  wallets!: Wallet[];

  @CreateDateColumn()
  created_at!: Date;
}
