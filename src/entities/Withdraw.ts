import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Wallet } from "./Wallet";
import { AgencyPersonal } from "./AgencyPersonal";
import { Transaction } from "./Transaction";

@Entity("withdraws")
export class Withdraw {
  @PrimaryGeneratedColumn({ name: "withdraw_id" })
  withdraw_id!: number;

  @ManyToOne(() => Wallet, (wallet) => wallet.withdraws, { onDelete: "CASCADE" })
  wallet!: Wallet;

  @ManyToOne(() => AgencyPersonal, (ap) => ap.withdraws, { onDelete: "CASCADE" })
  agency_personal!: AgencyPersonal;

  @OneToOne(() => Transaction, (transaction) => transaction.withdraw)
  @JoinColumn()
  transaction!: Transaction;

  @Column({ type: "float" })
  amount!: number;

  @Column({ type: "enum", enum: ["success", "pending", "failed"], default: "pending" })
  status!: "success" | "pending" | "failed";

  @Column({ name: "client_phone", length: 20 })
  clientPhone!: string;

  @Column({ name: "client_name", nullable: true })
  clientName?: string;

  @CreateDateColumn()
  created_at!: Date;
}
