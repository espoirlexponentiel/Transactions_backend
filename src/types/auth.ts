// src/types/auth.ts
export type UserRole = "admin" | "manager" | "personal";

export interface UserIdentity {
  userId: number;   // ID DE users
  role: UserRole;
  name: string;
}
