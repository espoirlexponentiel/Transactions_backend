import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Business } from "./Business";
import { Agency } from "./Agency";
import { Network } from "./Network";
import { Deposit } from "./Deposit";
import { Withdraw } from "./Withdraw";
import { Transaction } from "./Transaction";

@Entity("wallets")
export class Wallet {
  @PrimaryGeneratedColumn({ name: "wallet_id" })
  wallet_id!: number;

  // ✅ Relation directe avec le Business
  @ManyToOne(() => Business, (business) => business.wallets, { onDelete: "CASCADE" })
  business!: Business;

  // ✅ Relation directe avec l’Agency
  @ManyToOne(() => Agency, (agency) => agency.wallets, { onDelete: "CASCADE" })
  agency!: Agency;

  // ✅ Relation avec le Network
  @ManyToOne(() => Network, (network) => network.wallets, { onDelete: "CASCADE" })
  network!: Network;

  // ✅ Solde du wallet
  @Column({ type: "float", default: 0 })
  balance!: number;

  // ✅ Nouveau champ : code secret agent (numérique)
  @Column({ name: "secret_code", type: "int", nullable: true })
  secretCode?: number;

  @CreateDateColumn()
  created_at!: Date;

  // ✅ Relations inverses pour auditabilité
  @OneToMany(() => Deposit, (deposit) => deposit.wallet)
  deposits!: Deposit[];

  @OneToMany(() => Withdraw, (withdraw) => withdraw.wallet)
  withdraws!: Withdraw[];

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions!: Transaction[];
}
