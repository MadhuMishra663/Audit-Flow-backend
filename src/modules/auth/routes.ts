import { Router } from "express";
import {
  createCompanyAdmin,
  login,
  companyAdminRegister,
  me,
} from "../../modules/auth/controller";
import { allowRoles, protect } from "../../middleware/auth";

const router = Router();
router.post("/register", protect, allowRoles("ADMIN"), companyAdminRegister);
router.post("/login", login);
// router.post("/super-admin", createSuperAdmin);
router.post(
  "/create-admin",
  protect,
  allowRoles("SUPER_ADMIN"),
  createCompanyAdmin,
);
router.get("/me", protect, me);

export default router;
