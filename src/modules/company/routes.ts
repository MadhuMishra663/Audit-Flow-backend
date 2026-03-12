import { Router } from "express";
import { allowRoles, protect } from "../../middleware/auth";
import {
  createCompany,
  deleteCompany,
  getAllCompanies,
  getSingleCompany,
  updateCompany,
} from "./controller";
const router = Router();

router.post("/", protect, allowRoles("SUPER_ADMIN"), createCompany);
router.delete("/:companyId", protect, allowRoles("SUPER_ADMIN"), deleteCompany);
router.get("/", protect, allowRoles("SUPER_ADMIN"), getAllCompanies);
router.post("/:Id", protect, allowRoles("SUPER_ADMIN"), updateCompany);
router.get("/:Id", protect, allowRoles("SUPER_ADMIN"), getSingleCompany);
export default router;
