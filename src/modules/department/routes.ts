import { Router } from "express";
import {
  addMemberToDepartment,
  createDepartment,
  getDepartments,
} from "./controller";

const router = Router();

router.post("/createDepartment", createDepartment);
router.post("/add-member", addMemberToDepartment);
router.get("/", getDepartments);

export default router;
