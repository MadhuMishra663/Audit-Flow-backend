import { pool } from "../../config/db";
import { v4 as uuidv4 } from "uuid";

export const AUDIT_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'UPLOAD', 'VERSION'] as const;
export type AuditAction = typeof AUDIT_ACTIONS[number];

export interface PolicyAuditLog {
  id: string;
  policy_id: string | null;
  action: AuditAction;
  performed_by: string;
  old_data: any;
  new_data: any;
  created_at: Date;
}

// Create table
export const createPolicyAuditLogsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS policy_audit_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
      action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'UPLOAD', 'VERSION')),
      performed_by UUID NOT NULL,
      old_data JSONB,
      new_data JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
};

// Create Audit Log
export const createAuditLog = async (data: {
  policy_id?: string;
  action: AuditAction;
  performed_by: string;
  old_data?: any;
  new_data?: any;
}): Promise<PolicyAuditLog> => {
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO policy_audit_logs (id, policy_id, action, performed_by, old_data, new_data)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id, data.policy_id || null, data.action, data.performed_by, data.old_data ? JSON.stringify(data.old_data) : null, data.new_data ? JSON.stringify(data.new_data) : null]
  );
  return result.rows[0];
};


// Get Audit Logs by Policy ID
export const getAuditLogsByPolicyId = async (policyId: string, filters?: {
  action?: AuditAction;
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<PolicyAuditLog[]> => {
  let query = `
    SELECT pal.*, 
      u.name as performed_by_name, u.email as performed_by_email
    FROM policy_audit_logs pal
    LEFT JOIN users u ON pal.performed_by = u.id
    WHERE pal.policy_id = $1
  `;
  const values: any[] = [policyId];
  let paramIndex = 2;

  if (filters?.action) {
    query += ` AND pal.action = $${paramIndex++}`;
    values.push(filters.action);
  }
  if (filters?.start_date) {
    query += ` AND pal.created_at >= $${paramIndex++}`;
    values.push(filters.start_date);
  }
  if (filters?.end_date) {
    query += ` AND pal.created_at <= $${paramIndex++}`;
    values.push(filters.end_date);
  }

  query += ` ORDER BY pal.created_at DESC`;


  if (filters?.limit) {
    query += ` LIMIT $${paramIndex}`;
    values.push(filters.limit);
  }

  const result = await pool.query(query, values);
  return result.rows;
};
