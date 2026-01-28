import { Router } from "express";
import authRoutes from "./modules/auth/routes";
// import auditRoutes from "./modules/audit/routes.js";

const router = Router();

router.use("/auth", authRoutes);
// router.use("/audits", auditRoutes);

export default router;
