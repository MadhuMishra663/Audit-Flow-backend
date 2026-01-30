import { Router } from "express";
import {
  createBulkAuditQuestions,
  getMyDepartmentQuestions,
  submitDepartmentAnswer,
} from "./controller";
import { allowAuditor, protect } from "../../middleware/auth";

const router = Router();

router.post(
  "/createBulkQuestions",
  protect,
  allowAuditor,
  createBulkAuditQuestions,
);
router.get("/getQuestion", protect, getMyDepartmentQuestions);
router.post("/departmentSubmit", protect, submitDepartmentAnswer);

export default router;
