import { Request, Response } from "express";
import { validate as isUUID } from "uuid";
import { pool } from "../../config/db";
import { getRiskScore } from "../../utils/riskTypes";

export const createRisk = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      severity,
      status,
      department_id,
      assigned_to,
      due_date,
    } = req.body;

    // 1. Required fields
    if (!title || !severity || !department_id) {
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
    if (!isUUID(department_id)) {
      return res.status(400).json({ message: "Invalid department_id" });
    }

    if (role === "DEPARTMENT") {
      const userDept = await pool.query(
        `SELECT department_id FROM users WHERE id = $1`,
        [userId],
      );

      const userDepartmentId = userDept.rows[0]?.department_id;

      if (userDepartmentId !== department_id) {
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
        department_id,
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
