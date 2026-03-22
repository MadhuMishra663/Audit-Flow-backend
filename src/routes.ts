import { Router } from "express";
import authRoutes from "./modules/auth/authRoutes";
import departmentRoutes from "./modules/admin/department/departmentRoutes";
// import auditRoutes from "./modules/admin/audit/routes";
import userRoutes from "./modules/admin/user/userRoutes";
import companyRoutes from "./modules/company/routes";
import adminRoutes from "./modules/admin/adminRoutes";
import riskRoutes from "./modules/risk/riskRoutes";

const router = Router();

router.use("/admin", adminRoutes);
router.use("/auth", authRoutes);
router.use("/departments", departmentRoutes);
router.use("/risks", riskRoutes);
// router.use("/audits", auditRoutes);
router.use("/user", userRoutes);
router.use("/companies", companyRoutes);

export default router;
