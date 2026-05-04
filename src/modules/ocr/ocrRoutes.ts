import { Router } from "express";
import { protect, requireCompany } from "../../middleware/auth";
import { extractOCR } from "./controller";
import { upload } from "../../middleware/upload";

const router = Router();

// POST /api/ocr/extract
router.post(
  "/extract",
  // protect,
  // requireCompany,
  upload.single("file"),
  extractOCR,
);

export default router;
