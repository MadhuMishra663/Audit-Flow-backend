import { Request, Response } from "express";
import { pool } from "../../../config/db";

// ============================================
// GET AUDIT LOGS FOR POLICY
// ============================================
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, start_date, end_date, limit } = req.query;

    let query = `
      SELECT pal.*, 
        u.name as performed_by_name, u.email as performed_by_email
      FROM policy_audit_logs pal
      LEFT JOIN users u ON pal.performed_by = u.id
      WHERE pal.policy_id = $1
    `;

    const values: any[] = [id];
    let paramIndex = 2;


    if (action) {
      query += ` AND pal.action = $${paramIndex++}`;
      values.push(action);
    }

    if (start_date) {
      query += ` AND pal.created_at >= $${paramIndex++}`;
      values.push(start_date);
    }

    if (end_date) {
      query += ` AND pal.created_at <= $${paramIndex++}`;
      values.push(end_date);
    }

    query += ` ORDER BY pal.created_at DESC`;

    if (limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(parseInt(limit as string));
    }

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      audit_logs: result.rows,
    });
  } catch (error) {
    console.error("Get Audit Logs Error:", error);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
};

// ============================================
// CREATE AUDIT LOG (Internal use)
// ============================================
export const createAuditLog = async (
  client: any,
  policyId: string,
  action: string,
  performedBy: string,
  oldData?: any,
  newData?: any
) => {
  try {
    await client.query(
      `INSERT INTO policy_audit_logs (policy_id, action, performed_by, old_data, new_data)
       VALUES ($1, $2, $3, $4, $5)`,
      [policyId, action, performedBy, oldData ? JSON.stringify(oldData) : null, newData ? JSON.stringify(newData) : null]
    );
  } catch (error) {
    console.error("Create Audit Log Error:", error);
    throw error;
  }
};
