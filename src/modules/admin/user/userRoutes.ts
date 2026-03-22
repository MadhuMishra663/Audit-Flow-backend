import { Router } from "express";
import { createUserByAdmin } from "./controller";
import { allowRoles, protect } from "../../../middleware/auth";

const router = Router();

/* ======================================================
   USERS (ADMIN)
====================================================== */

// POST /api/admin/users
router.post("/", protect, allowRoles("ADMIN"), createUserByAdmin);

export default router;
