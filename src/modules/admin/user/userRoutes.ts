import { Router } from "express";
import { createUserByAdmin, getCompanyUsers } from "./controller";
import { allowRoles, protect } from "../../../middleware/auth";

const router = Router();

/* ======================================================
   USERS (ADMIN)
====================================================== */

// POST /api/admin/users
router.post("/", protect, allowRoles("ADMIN"), createUserByAdmin);
router.get("/company-users", protect, allowRoles("ADMIN"), getCompanyUsers);
export default router;
