import { Router } from "express";
import { protect, allowRoles } from "../../middleware/auth";
import {
  createPolicy,
  getAllPolicies,
  getPolicyById,
  updatePolicy,
  deletePolicy,
  archivePolicy,
} from "./controllers/policyController";

import {
  createVersion,
  getVersions,
  getCurrentVersion,
  setCurrentVersion,
} from "./controllers/versionController";

import {
  uploadPolicyFile,
  getPolicyFiles,
  getFile,
  deleteFile,
  downloadFile,
} from "./controllers/fileController";

import {
  submitForApproval,
  getApprovals,
  approvePolicy,
  rejectPolicy,
  getPendingApprovals,
} from "./controllers/approvalController";


import {
  createControl,
  getControls,
  getControlById,
  mapPolicyToControl,
  unmapPolicyFromControl,
  getPolicyControls,
  getPoliciesByControl,
} from "./controllers/controlController";

import {
  getAuditLogs,
  createAuditLog,
} from "./controllers/auditLogController";

import { upload } from "../../middleware/upload";

const router = Router();

/* ============================================
   POLICY CRUD
============================================ */
router.post("/", protect, allowRoles("ADMIN", "AUDITOR"), createPolicy);
router.get("/", protect, allowRoles("ADMIN", "AUDITOR", "DEPARTMENT"), getAllPolicies);
router.get("/:id", protect, allowRoles("ADMIN", "AUDITOR", "DEPARTMENT"), getPolicyById);
router.put("/:id", protect, allowRoles("ADMIN", "AUDITOR"), updatePolicy);
router.delete("/:id", protect, allowRoles("ADMIN"), deletePolicy);
router.patch("/:id/archive", protect, allowRoles("ADMIN"), archivePolicy);

/* ============================================
   POLICY VERSIONS
============================================ */
router.post("/:id/versions", protect, allowRoles("ADMIN", "AUDITOR"), createVersion);
router.get("/:id/versions", protect, allowRoles("ADMIN", "AUDITOR", "DEPARTMENT"), getVersions);
router.get("/:id/versions/current", protect, allowRoles("ADMIN", "AUDITOR", "DEPARTMENT"), getCurrentVersion);
router.patch("/:id/versions/:versionId/set-current", protect, allowRoles("ADMIN"), setCurrentVersion);

/* ============================================
   POLICY FILES
============================================ */
router.post("/:id/files", protect, allowRoles("ADMIN", "AUDITOR"), upload.single("file"), uploadPolicyFile);
router.get("/:id/files", protect, allowRoles("ADMIN", "AUDITOR", "DEPARTMENT"), getPolicyFiles);
router.get("/files/:fileId", protect, allowRoles("ADMIN", "AUDITOR", "DEPARTMENT"), getFile);
router.get("/files/:fileId/download", protect, allowRoles("ADMIN", "AUDITOR", "DEPARTMENT"), downloadFile);
router.delete("/files/:fileId", protect, allowRoles("ADMIN"), deleteFile);

/* ============================================
   POLICY APPROVALS
============================================ */
router.post("/:id/approve", protect, allowRoles("ADMIN", "AUDITOR"), submitForApproval);
router.get("/:id/approvals", protect, allowRoles("ADMIN", "AUDITOR"), getApprovals);
router.patch("/approvals/:approvalId/approve", protect, allowRoles("ADMIN"), approvePolicy);
router.patch("/approvals/:approvalId/reject", protect, allowRoles("ADMIN"), rejectPolicy);
router.get("/approvals/pending", protect, allowRoles("ADMIN"), getPendingApprovals);

/* ============================================
   CONTROLS
============================================ */
router.post("/controls", protect, allowRoles("ADMIN"), createControl);
router.get("/controls", protect, allowRoles("ADMIN", "AUDITOR", "DEPARTMENT"), getControls);
router.get("/controls/:controlId", protect, allowRoles("ADMIN", "AUDITOR", "DEPARTMENT"), getControlById);
router.post("/:id/controls", protect, allowRoles("ADMIN", "AUDITOR"), mapPolicyToControl);
router.delete("/:id/controls/:controlId", protect, allowRoles("ADMIN"), unmapPolicyFromControl);
router.get("/:id/controls", protect, allowRoles("ADMIN", "AUDITOR", "DEPARTMENT"), getPolicyControls);
router.get("/controls/:controlId/policies", protect, allowRoles("ADMIN", "AUDITOR"), getPoliciesByControl);


/* ============================================
   AUDIT LOGS
============================================ */
router.get("/:id/audit-logs", protect, allowRoles("ADMIN", "AUDITOR"), getAuditLogs);

export default router;
