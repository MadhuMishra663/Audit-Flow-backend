// src/routes/users.ts
import { Router } from "express";
import { createUserByAdmin } from "../user/controller";
import { protect, isAdmin } from "../../middleware/auth";

const router = Router();

router.post("/create", protect, isAdmin, createUserByAdmin);

export default router;
