import { Router } from "express";
import authRoutes from "./modules/auth/routes";
// import departmentRoutes from "./modules/admin/department/routes";
// import auditRoutes from "./modules/admin/audit/routes";
// import userRoutes from "./modules/admin/user/routes";
import companyRoutes from "./modules/company/routes";
import adminRoutes from "./modules/admin/routes";

const router = Router();

router.use("/admin", adminRoutes);
router.use("/auth", authRoutes);
// router.use("/departments", departmentRoutes);
// router.use("/audits", auditRoutes);
// router.use("/user", userRoutes);
router.use("/companies", companyRoutes);

export default router;
