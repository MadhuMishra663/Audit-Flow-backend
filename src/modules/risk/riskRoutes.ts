import { Router } from "express";
import { allowRoles, protect, requireCompany } from "../../middleware/auth";
import {
  createRisk,
  getAllRisks,
  getRisks,
  uploadRiskAttachment,
  updateRiskStatus,
  getRiskAttachments,
  deleteAttachment,
  getAttachment,
} from "./controller";
import { upload } from "../../middleware/upload";

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

router.get(
  "/all",
  protect,
  requireCompany,
  allowRoles("ADMIN", "AUDITOR", "DEPARTMENT"),
  getAllRisks,
);
router.post(
  "/:riskId/attachment",
  protect,
  requireCompany,
  allowRoles("ADMIN", "AUDITOR", "DEPARTMENT"),
  upload.single("file"),
  uploadRiskAttachment,
);
router.post(
  "/:riskId/status",
  protect,
  requireCompany,
  allowRoles("ADMIN", "AUDITOR", "DEPARTMENT"),
  updateRiskStatus,
);
router.get(
  "/:riskId/attachments",
  protect,
  requireCompany,
  allowRoles("ADMIN", "AUDITOR", "DEPARTMENT"),
  getRiskAttachments,
);
router.delete(
  "/attachment/:attachmentId",
  protect,
  requireCompany,
  allowRoles("ADMIN", "AUDITOR", "DEPARTMENT"),
  deleteAttachment,
);
router.get(
  "/attachment/:attachmentId",
  protect,
  requireCompany,
  allowRoles("ADMIN", "AUDITOR", "DEPARTMENT"),
  getAttachment,
);
export default router;
