import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToOne,
} from "typeorm";
import { Wallet } from "./Wallet";
import { AgencyPersonal } from "./AgencyPersonal";
import { Deposit } from "./Deposit";
import { Withdraw } from "./Withdraw";

@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn({ name: "transaction_id" })
  transaction_id!: number;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions, { onDelete: "CASCADE" })
  wallet!: Wallet;

  @ManyToOne(() => AgencyPersonal, (ap) => ap.transactions, { onDelete: "CASCADE" })
  agency_personal!: AgencyPersonal;

  @Column({ type: "enum", enum: ["deposit", "withdraw", "topup"] })
  type!: "deposit" | "withdraw" | "topup";

  @Column({ type: "float" })
  amount!: number;

  @Column({ type: "enum", enum: ["success", "pending", "failed"], default: "pending" })
  status!: "success" | "pending" | "failed";

  @Column({ name: "client_phone", length: 20 })
  clientPhone!: string;

  @Column({ name: "client_name", nullable: true })
  clientName?: string;

  @Column({ name: "ussd_code", type: "varchar", length: 120, nullable: true })
  ussdCode?: string;

  // ✅ Relations OneToOne
  @OneToOne(() => Deposit, (deposit) => deposit.transaction, { cascade: true })
  deposit?: Deposit;

  @OneToOne(() => Withdraw, (withdraw) => withdraw.transaction, { cascade: true })
  withdraw?: Withdraw;

  @CreateDateColumn()
  created_at!: Date;
}
