import { Request, Response } from "express";
import * as FileDB from "../../../db/policy/policyFiles";
import * as AuditLogDB from "../../../db/policy/policyAuditLogs";
import { getPolicyById } from "../../../db/policy/policies";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// ============================================
// UPLOAD POLICY FILE
// ============================================
export const uploadPolicyFile = async (req: Request, res: Response) => {
  try {
    const { id: policyId } = req.params;
    const file = req.file;
    const performedBy = req.user!.userId;

    const policy = await getPolicyById(policyId);
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileBuffer = fs.readFileSync(file.path);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const policyFile = await FileDB.createPolicyFile({
      file_name: file.originalname,
      file_path: `/uploads/${file.filename}`,
      file_size: file.size,
      mime_type: file.mimetype,
      checksum,
      uploaded_by: performedBy,
    });

    await AuditLogDB.createAuditLog({
      policy_id: policyId,
      action: 'UPLOAD',
      performed_by: performedBy,
      new_data: policyFile,
    });

    res.status(201).json({ success: true, file: policyFile });
  } catch (error) {
    console.error("Upload Policy File Error:", error);
    res.status(500).json({ message: "Failed to upload file" });
  }
};

// ============================================
// GET POLICY FILES
// ============================================
export const getPolicyFiles = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const files = await FileDB.getFilesByPolicyId(id);

    res.status(200).json({
      success: true,
      count: files.length,
      files,
    });
  } catch (error) {
    console.error("Get Policy Files Error:", error);
    res.status(500).json({ message: "Failed to fetch files" });
  }
};

// ============================================
// GET FILE INFO
// ============================================
export const getFile = async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const file = await FileDB.getFileById(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    res.status(200).json({ success: true, file });
  } catch (error) {
    console.error("Get File Error:", error);
    res.status(500).json({ message: "Failed to fetch file" });
  }
};

// ============================================
// DOWNLOAD FILE
// ============================================
export const downloadFile = async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const file = await FileDB.getFileById(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const filePath = path.join(process.cwd(), 'uploads', path.basename(file.file_path));

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on disk" });
    }

    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
    if (file.file_size) {
    res.setHeader('Content-Length', file.file_size);
    }
    fs.createReadStream(filePath).pipe(res);
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error("Download File Error:", error);
    res.status(500).json({ message: "Failed to download file" });
  }
};

// ============================================
// DELETE FILE
// ============================================
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const file = await FileDB.getFileById(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    await FileDB.deletePolicyFile(fileId);
    const filePath = path.join(process.cwd(), 'uploads', path.basename(file.file_path));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(200).json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete File Error:", error);
    res.status(500).json({ message: "Failed to delete file" });
  }
};

