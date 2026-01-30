import { Router } from "express";
import authRoutes from "./modules/auth/routes";
import departmentRoutes from "./modules/department/routes";
import auditRoutes from "./modules/audit/routes";
import userRoutes from "./modules/user/routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/departments", departmentRoutes);
router.use("/audits", auditRoutes);
router.use("/user", userRoutes);

export default router;
