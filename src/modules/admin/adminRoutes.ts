import { Router } from "express";
import { allowRoles, protect } from "../../middleware/auth";

import {
  createAudit,
  getCompanyAudits,
  reassignAuditor,
  updateAuditStatus,
} from "./audit/controller";

import {
  // addMemberToDepartment,
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "./department/controller";

import { companyAdminRegister } from "../auth/controller";

const router = Router();

/* ======================================================
   AUDITS
====================================================== */

// GET /api/admin/audits
router.get(
  "/audits",
  protect,
  allowRoles("ADMIN", "AUDITOR"),
  getCompanyAudits,
);

// POST /api/admin/audits
router.post("/audits", protect, allowRoles("AUDITOR"), createAudit);

// PATCH /api/admin/audits/status
router.post(
  "/audits/status",
  protect,
  allowRoles("ADMIN", "AUDITOR"),
  updateAuditStatus,
);

// PATCH /api/admin/audits/:id/reassign
router.post(
  "/audits/:id/reassign",
  protect,
  allowRoles("ADMIN"),
  reassignAuditor,
);

/* ======================================================
   USERS (Company Admin creates & manages users)
====================================================== */

// POST /api/admin/users
router.post("/users", protect, allowRoles("ADMIN"), companyAdminRegister);

/* ======================================================
   DEPARTMENTS
====================================================== */

// POST /api/admin/departments
// router.post("/departments", protect, allowRoles("ADMIN"), createDepartment);

// GET /api/admin/departments
// router.get("/departments", protect, allowRoles("ADMIN"), getDepartments);

// POST /api/admin/departments/add-member
// router.post(
//   "/departments/add-member",
//   protect,
//   allowRoles("ADMIN"),
//   addMemberToDepartment,
// );

// PATCH /api/admin/departments/:departmentId
router.post(
  "/departments/:departmentId",
  protect,
  allowRoles("ADMIN"),
  updateDepartment,
);

// DELETE /api/admin/departments/:departmentId
router.delete(
  "/departments/:departmentId",
  protect,
  allowRoles("ADMIN"),
  deleteDepartment,
);

export default router;
