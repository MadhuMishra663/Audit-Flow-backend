import { Router } from "express";
import authRoutes from "./modules/auth/authRoutes";
import departmentRoutes from "./modules/admin/department/departmentRoutes";
import userRoutes from "./modules/admin/user/userRoutes";
import companyRoutes from "./modules/company/routes";
import adminRoutes from "./modules/admin/adminRoutes";
import riskRoutes from "./modules/risk/riskRoutes";
import ocrRoutes from "./modules/ocr/ocrRoutes";
import policyRoutes from "./modules/policy/routes";

const router = Router();

router.use("/admin", adminRoutes);
router.use("/auth", authRoutes);
router.use("/departments", departmentRoutes);
router.use("/risks", riskRoutes);
// router.use("/audits", auditRoutes);
router.use("/ocr", ocrRoutes);
router.use("/user", userRoutes);
router.use("/companies", companyRoutes);
router.use("/policies", policyRoutes);

export default router;

