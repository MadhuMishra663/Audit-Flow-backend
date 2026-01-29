import { Router } from "express";
import { addMemberToDepartment, createDepartment } from "./controller";

const router = Router();

router.post("/create", createDepartment);
router.post("/add-member", addMemberToDepartment);

export default router;
