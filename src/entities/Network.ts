import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Country } from "./Country";
import { Wallet } from "./Wallet";

@Entity("networks")
export class Network {
  @PrimaryGeneratedColumn({ name: "network_id" })
  network_id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => Country, country => country.networks)
  country!: Country;

  @OneToMany(() => Wallet, wallet => wallet.network)
  wallets!: Wallet[];
}
