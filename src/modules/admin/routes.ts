import { Router } from "express";
import { allowAuditor, allowRoles, protect } from "../../middleware/auth";

import {
  createAudit,
  getCompanyAudits,
  reassignAuditor,
  updateAuditStatus,
} from "./audit/controller";

import { adminDashboard } from "./dashboard";

import {
  addMemberToDepartment,
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "./department/controller";

import { companyAdminRegister } from "../auth/controller";
import { getCompanyUsers, updateUserStatus } from "./user/controller";

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
   DASHBOARD
====================================================== */

// GET /api/admin/dashboard
router.get("/dashboard", protect, allowRoles("ADMIN"), adminDashboard);

/* ======================================================
   USERS (Company Admin creates & manages users)
====================================================== */

// POST /api/admin/users
router.post("/users", protect, allowRoles("ADMIN"), companyAdminRegister);

// PATCH /api/admin/users/:id/status
router.post(
  "/users/:id/status",
  protect,
  allowRoles("ADMIN"),
  updateUserStatus,
);

// GET /api/admin/users
router.get("/users", protect, allowRoles("ADMIN"), getCompanyUsers);

/* ======================================================
   DEPARTMENTS
====================================================== */

// POST /api/admin/departments
router.post("/departments", protect, allowRoles("ADMIN"), createDepartment);

// GET /api/admin/departments
router.get("/departments", protect, allowRoles("ADMIN"), getDepartments);

// POST /api/admin/departments/add-member
router.post(
  "/departments/add-member",
  protect,
  allowRoles("ADMIN"),
  addMemberToDepartment,
);

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
