import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || "3000";
export const DB_HOST = process.env.DB_HOST || "localhost";
export const DB_PORT = parseInt(process.env.DB_PORT || "3306", 10);
export const DB_USER = process.env.DB_USER || "mobileuser";
export const DB_PASSWORD = process.env.DB_PASSWORD || "ExpoMoney1!/";
export const DB_NAME = process.env.DB_NAME || "mobilemoney";
export const JWT_SECRET = process.env.JWT_SECRET || "A9f$3kLz!Qw8@Xy7*Mn2^Rt0&Vp4*Zs";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "3d";
