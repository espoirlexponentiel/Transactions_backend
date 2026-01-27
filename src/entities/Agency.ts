import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from "typeorm";
import { Business } from "./Business";
import { Country } from "./Country";
import { Wallet } from "./Wallet";
import { Manager } from "./Manager";
import { AgencyPersonal } from "./AgencyPersonal";

@Entity("agencies")
export class Agency {
  @PrimaryGeneratedColumn({ name: "agency_id" })
  agency_id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => Business, business => business.agencies)
  business!: Business;

  @ManyToOne(() => Country, country => country.agencies)
  country!: Country;

  @ManyToOne(() => Manager, manager => manager.agencies)
  manager!: Manager;

  @OneToMany(() => Wallet, wallet => wallet.agency)
  wallets!: Wallet[];

  // ✅ Relation pivot avec les agents
  @OneToMany(() => AgencyPersonal, agencyPersonal => agencyPersonal.agency)
  agencyPersonals!: AgencyPersonal[];

  @CreateDateColumn()
  created_at!: Date;
}
