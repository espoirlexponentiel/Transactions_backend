import "reflect-metadata";
import express, { Request, Response } from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import { PORT } from "./config/env";

// ✅ Import des routes
import authRoutes from "./routes/auth";

// --- Admin routes
import countryRoutes from "./routes/admin/countries";
import networkRoutes from "./routes/admin/networks";

// --- Manager routes
import managerBusinessRoutes from "./routes/manager/business";
import managerAgenciesRoutes from "./routes/manager/agencies";
import managerPersonalsRoutes from "./routes/manager/personals";
import managerWalletsRoutes from "./routes/manager/wallets"; // ✅ ajouté
import WalletsController from "./routes/personal/wallets";
import StatsController from "./routes/personal/stats";
import ManagerStatsController from "./routes/manager/reports";
import PersonalTopupController from "./routes/personal/topup"; // ✅ ajouté

// --- Personal routes
import personalTransactionsRoutes from "./routes/personal/transactions"; // ✅ ajouté
//import PersonalTransactionsController from "./routes/personal/transactions";

const app = express();

app.use(cors());


// ✅ Middlewares globaux
app.use(express.json());

// ✅ Route de test (avant DB init pour vérifier rapidement si l’API tourne)
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "OK", message: "API MobileMoney fonctionne 🚀" });
});



// ✅ Initialisation de la base de données
AppDataSource.initialize()
  .then(() => {
    console.log("✅ Connecté à MySQL avec TypeORM");

    // ✅ Montage des routes
    app.use("/auth", authRoutes);

    // --- Admin
    app.use("/admin/countries", countryRoutes);
    app.use("/admin/networks", networkRoutes);

    // --- Manager
    app.use("/manager/business", managerBusinessRoutes);
    app.use("/manager/agencies", managerAgenciesRoutes);
    app.use("/manager/personals", managerPersonalsRoutes);
    app.use("/manager/wallets", managerWalletsRoutes); // ✅ nouveau
    app.use("/manager/reports", ManagerStatsController); // ✅ nouveau

    // --- Personal
    app.use("/personal/transactions", personalTransactionsRoutes); // ✅ nouveau
    app.use("/personal/wallets", WalletsController); // ✅ nouveau
    app.use("/personal/stats", StatsController); // ✅ nouveau
    app.use("/personal/topup", PersonalTopupController); // ✅ nouveau
    //app.use("/personal/transactions", PersonalTransactionsController);

    // ✅ Lancement du serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Erreur connexion DB:", err);
    process.exit(1); // 🔹 Arrête le serveur si la DB ne démarre pas
  });
