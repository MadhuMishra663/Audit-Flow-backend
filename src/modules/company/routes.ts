import { Router } from "express";
import { allowRoles, protect } from "../../middleware/auth";
import { createCompany, deleteCompany } from "./controller";
const router = Router();

router.post("/", protect, allowRoles("SUPER_ADMIN"), createCompany);
router.delete("/:companyId", protect, allowRoles("SUPER_ADMIN"), deleteCompany);
export default router;
