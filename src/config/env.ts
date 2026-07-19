import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`❌ Variable d'environnement manquante : ${name}`);
  }
  return value;
}

export const PORT = process.env.PORT || "3000";

export const DB_HOST = requireEnv("DB_HOST");
export const DB_PORT = parseInt(process.env.DB_PORT || "3306", 10);
export const DB_USER = requireEnv("DB_USER");
export const DB_PASSWORD = requireEnv("DB_PASSWORD");
export const DB_NAME = requireEnv("DB_NAME");
export const DB_SSL = process.env.DB_SSL === "true";

export const JWT_SECRET = requireEnv("JWT_SECRET");
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "3d";