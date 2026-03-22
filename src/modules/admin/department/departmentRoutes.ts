import { Router } from "express";
import { allowRoles, protect } from "../../../middleware/auth";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "./controller";

const router = Router();

/* ======================================================
   DEPARTMENTS (ADMIN)
====================================================== */

// POST /api/admin/departments
router.post("/create", protect, allowRoles("ADMIN"), createDepartment);
router.get("/", protect, allowRoles("ADMIN"), getDepartments);
router.post("/:id", protect, allowRoles("ADMIN"), updateDepartment);
router.delete("/:id", protect, allowRoles("ADMIN"), deleteDepartment);
export default router;
