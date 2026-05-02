import { Request, Response } from "express";
import { validate as isUUID } from "uuid";
import { pool } from "../../config/db";
import { getRiskScore } from "../../utils/riskTypes";
import zlib from "zlib";
import fs from "fs";

export const createRisk = async (req: Request, res: Response) => {
  try {
    const { title, description, severity, status, id, assigned_to, due_date } =
      req.body;

    // 1. Required fields
    if (!title || !severity || !id) {
      return res.status(400).json({
        message: "Title, severity and department_id are required",
      });
    }

    // 2. Auth check
    if (!req.user?.companyId || !req.user?.userId) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const { companyId, userId, role } = req.user;

    // 3. UUID validation
    if (!isUUID(id)) {
      return res.status(400).json({ message: "Invalid risk ID" });
    }

    if (role === "DEPARTMENT") {
      const userDept = await pool.query(
        `SELECT department_id FROM users WHERE id = $1`,
        [userId],
      );

      const userDepartmentId = userDept.rows[0]?.department_id;

      if (userDepartmentId !== id) {
        return res.status(403).json({
          message: "You can only create risks for your own department",
        });
      }
    }

    const risk_score = getRiskScore(severity);

    // 👉 ADMIN & AUDITOR → no restriction

    // 5. Insert risk
    const result = await pool.query(
      `INSERT INTO risks (
        title,
        description,
        severity,
        status,
        company_id,
         risk_score,
        department_id,
        assigned_to,
        created_by,
        due_date
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        title,
        description || null,
        severity,
        status || "OPEN",
        companyId,
        risk_score,
        id,
        assigned_to || null,
        userId,
        due_date || null,
      ],
    );

    res.status(201).json({
      success: true,
      risk: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to create risk",
    });
  }
};

export const getRisks = async (req: Request, res: Response) => {
  try {
    if (!req.user?.companyId || !req.user?.role || !req.user?.userId) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const { companyId, role, userId } = req.user;

    let query = `
      SELECT 
        r.*,
        u.name AS assigned_to_name,
        d.name AS department_name
      FROM risks r
      LEFT JOIN users u ON r.assigned_to = u.id
      LEFT JOIN departments d ON r.department_id = d.id
      WHERE r.company_id = $1
    `;

    const values: any[] = [companyId];

    // 🔥 Role-based filtering
    if (role === "DEPARTMENT") {
      query += ` AND r.department_id = (
        SELECT department_id FROM users WHERE id = $2
      )`;
      values.push(userId);
    }

    // 🔹 Optional filters (query params)
    const { status, severity } = req.query;

    if (status) {
      query += ` AND r.status = $${values.length + 1}`;
      values.push(status);
    }

    if (severity) {
      query += ` AND r.severity = $${values.length + 1}`;
      values.push(severity);
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      risks: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch risks",
    });
  }
};

export const getAllRisks = async (req: Request, res: Response) => {
  try {
    if (!req.user?.companyId || !req.user?.role || !req.user?.userId) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const { companyId, role, userId } = req.user;

    let query = `
      SELECT 
        r.*,
        u.name AS assigned_to_name,
        d.name AS department_name
      FROM risks r
      LEFT JOIN users u ON r.assigned_to = u.id
      LEFT JOIN departments d ON r.department_id = d.id
      WHERE r.company_id = $1
    `;

    const values: (string | number)[] = [companyId];

    if (role === "DEPARTMENT") {
      query += ` AND r.department_id = (
        SELECT department_id FROM users WHERE id = $2
      )`;
      values.push(userId);
    }

    const { status, severity } = req.query;

    if (typeof status === "string") {
      query += ` AND r.status = $${values.length + 1}`;
      values.push(status);
    }

    if (typeof severity === "string") {
      query += ` AND r.severity = $${values.length + 1}`;
      values.push(severity);
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      risks: result.rows,
    });
  } catch (err) {
    console.error("GET RISKS ERROR:", err);
    return res.status(500).json({
      message: "Failed to fetch risks",
    });
  }
};

// export const uploadRiskAttachment = async (req: Request, res: Response) => {
//   try {
//     const { riskId } = req.params;
//     const file = req.file;
//     if (!file) {
//       return res.status(400).json({ message: "File required" });
//     }
//     if (!req.user) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }
//     const fileUrl = `/uploads/${file.filename}`;

//     const result = await pool.query(
//       `INSERT INTO risk_attachments
//        (risk_id, uploaded_by, file_url, file_name, mime_type)
//        VALUES ($1,$2,$3,$4,$5)
//        RETURNING id, file_url, file_name`,
//       [riskId, req.user.userId, fileUrl, file.originalname, file.mimetype],
//     );

//     res.status(201).json({
//       success: true,
//       attachment: result.rows[0],
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Upload failed" });
//   }
// };

// export const getAttachment = async (req: Request, res: Response) => {
//   try {
//     const { attachmentId } = req.params;

//     const result = await pool.query(
//       `SELECT file_data, file_name, mime_type
//        FROM risk_attachments
//        WHERE id = $1`,
//       [attachmentId],
//     );

//     if (!result.rows.length) {
//       return res.status(404).json({ message: "File not found" });
//     }

//     const { file_data, file_name, mime_type } = result.rows[0];

//     // decompress
//     const decompressed = zlib.gunzipSync(file_data);

//     res.setHeader("Content-Type", mime_type);
//     res.setHeader("Content-Disposition", `inline; filename="${file_name}"`);

//     res.send(decompressed);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to fetch file" });
//   }
// };
export const uploadRiskAttachment = async (req: Request, res: Response) => {
  try {
    const { riskId } = req.params;
    const file = req.file;
    const { text } = req.body;
    console.log("FILE:", file);
    console.log("BODY:", req.body);
    if (!file && !text) {
      return res.status(400).json({ message: "File or text is required" });
    }

    let fileData = null;
    let fileName = null;
    let mimeType = null;
    let file_url = null;

    if (file) {
      const fileBuffer = fs.readFileSync(file.path);
      fileData = zlib.gzipSync(fileBuffer);
      fileName = file.originalname;
      mimeType = file.mimetype;
      file_url = `/uploads/${file.filename}`;
    }

    const result = await pool.query(
      `INSERT INTO risk_attachments 
       (risk_id, file_url, file_name, file_data, mime_type, evidence_text)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [riskId, file_url, fileName, fileData, mimeType, text || null],
    );

    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
};
export const getRiskAttachments = async (req: Request, res: Response) => {
  try {
    const { riskId } = req.params;

    const result = await pool.query(
      `SELECT id, file_name, evidence_text
       FROM risk_attachments 
       WHERE risk_id = $1
       ORDER BY created_at DESC`,
      [riskId],
    );

    // 👇 return metadata ONLY (NOT file_data)
    const attachments = result.rows.map((row) => ({
      id: row.id,
      file_name: row.file_name,
      file_url: row.file_name ? `/risks/attachment/${row.id}` : null,
      text: row.evidence_text,
    }));

    res.json({ attachments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch attachments" });
  }
};

export const updateRiskStatus = async (req: Request, res: Response) => {
  try {
    const { riskId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // optional validation (recommended)
    const allowedStatuses = ["OPEN", "IN_PROGRESS", "CLOSED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const result = await pool.query(
      `
      UPDATE risks
      SET status = $1
      WHERE id = $2
      RETURNING id, status
      `,
      [status, riskId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Risk not found" });
    }

    return res.status(200).json({
      success: true,
      risk: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update status" });
  }
};

export const deleteAttachment = async (req: Request, res: Response) => {
  try {
    const { attachmentId } = req.params;

    const result = await pool.query(
      `DELETE FROM risk_attachments 
       WHERE id = $1 
       RETURNING id`,
      [attachmentId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    res.json({
      message: "Attachment deleted successfully",
      id: result.rows[0].id,
    });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Failed to delete attachment" });
  }
};
export const getAttachment = async (req: Request, res: Response) => {
  try {
    const { attachmentId } = req.params;

    const result = await pool.query(
      `SELECT file_data, file_name, mime_type 
       FROM risk_attachments 
       WHERE id = $1`,
      [attachmentId],
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: "File not found" });
    }

    const { file_data, file_name, mime_type } = result.rows[0];

    // ✅ CASE 1: TEXT ONLY (NO FILE)
    if (!file_data) {
      return res.status(400).json({
        message: "This attachment has no file (text only)",
      });
    }

    let buffer;

    try {
      // ✅ Try unzip (for gzipped files)
      buffer = zlib.gunzipSync(file_data);
    } catch (err) {
      console.warn("Not gzipped, sending raw buffer");
      // ✅ fallback (if file wasn't gzipped)
      buffer = file_data;
    }

    res.setHeader("Content-Type", mime_type || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file_name || "file"}"`,
    );

    return res.send(buffer);
  } catch (err) {
    console.error("DOWNLOAD ERROR:", err);
    return res.status(500).json({
      message: "Failed to fetch file",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};
