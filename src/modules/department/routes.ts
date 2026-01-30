import { Router } from "express";
import { addMemberToDepartment, createDepartment } from "./controller";

const router = Router();

router.post("/createDepartment", createDepartment);
router.post("/add-member", addMemberToDepartment);

export default router;
