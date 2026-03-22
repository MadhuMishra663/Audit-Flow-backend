import { Router } from "express";
import { allowRoles, protect, requireCompany } from "../../middleware/auth";
import { createRisk, getRisks } from "./controller";

const router = Router();

router.post(
  "/create",
  protect,
  requireCompany,
  allowRoles("ADMIN", "AUDITOR", "DEPARTMENT"),
  createRisk,
);
router.get(
  "/",
  protect,
  requireCompany,
  allowRoles("ADMIN", "AUDITOR", "DEPARTMENT"),
  getRisks,
);
export default router;
