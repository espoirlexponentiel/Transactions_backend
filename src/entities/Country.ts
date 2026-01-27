import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Network } from "./Network";
import { Agency } from "./Agency";

@Entity("countries")
export class Country {
  @PrimaryGeneratedColumn({ name: "country_id" })
  country_id!: number;

  @Column()
  name!: string;

  @OneToMany(() => Network, network => network.country)
  networks!: Network[];

  @OneToMany(() => Agency, agency => agency.country)
  agencies!: Agency[];
}
