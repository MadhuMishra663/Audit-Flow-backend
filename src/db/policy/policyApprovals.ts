import { pool } from "../../config/db";
import { v4 as uuidv4 } from "uuid";

export const APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type ApprovalStatus = typeof APPROVAL_STATUSES[number];

export interface PolicyApproval {
  id: string;
  policy_id: string;
  version_id: string | null;
  approver_id: string;
  status: ApprovalStatus;
  comments: string | null;
  approved_at: Date | null;
  created_at: Date;
}

// Create table
export const createPolicyApprovalsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS policy_approvals (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
      version_id UUID REFERENCES policy_versions(id) ON DELETE CASCADE,
      approver_id UUID NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
      comments TEXT,
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
};

// Create Approval Request
export const createApproval = async (data: {
  policy_id: string;
  version_id?: string;
  approver_id: string;
  comments?: string;
}): Promise<PolicyApproval> => {
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO policy_approvals (id, policy_id, version_id, approver_id, comments, status)
     VALUES ($1, $2, $3, $4, $5, 'PENDING')
     RETURNING *`,
    [id, data.policy_id, data.version_id || null, data.approver_id, data.comments || null]
  );
  return result.rows[0];
};

// Get Approvals by Policy ID
export const getApprovalsByPolicyId = async (policyId: string): Promise<PolicyApproval[]> => {
  const result = await pool.query(
    `SELECT pa.*, u.name as approver_name, u.email as approver_email, pv.version_number
     FROM policy_approvals pa
     LEFT JOIN users u ON pa.approver_id = u.id
     LEFT JOIN policy_versions pv ON pa.version_id = pv.id
     WHERE pa.policy_id = $1
     ORDER BY pa.created_at DESC`,
    [policyId]
  );
  return result.rows;
};

// Get Pending Approvals
export const getPendingApprovals = async (): Promise<PolicyApproval[]> => {
  const result = await pool.query(
    `SELECT pa.*, 
      u.name as approver_name, u.email as approver_email,
      p.title as policy_title, p.description as policy_description,
      pv.version_number
     FROM policy_approvals pa
     LEFT JOIN users u ON pa.approver_id = u.id
     LEFT JOIN policies p ON pa.policy_id = p.id
     LEFT JOIN policy_versions pv ON pa.version_id = pv.id
     WHERE pa.status = 'PENDING'
     ORDER BY pa.created_at ASC`,
    []
  );
  return result.rows;
};

// Approve Policy
export const approvePolicy = async (id: string, comments?: string): Promise<PolicyApproval | null> => {
  const result = await pool.query(
    `UPDATE policy_approvals 
     SET status = 'APPROVED', comments = COALESCE($1, comments), approved_at = NOW()
     WHERE id = $2 AND status = 'PENDING'
     RETURNING *`,
    [comments, id]
  );
  return result.rows[0] || null;
};

// Reject Policy
export const rejectPolicy = async (id: string, comments: string): Promise<PolicyApproval | null> => {
  const result = await pool.query(
    `UPDATE policy_approvals 
     SET status = 'REJECTED', comments = $1, approved_at = NOW()
     WHERE id = $2 AND status = 'PENDING'
     RETURNING *`,
    [comments, id]
  );
  return result.rows[0] || null;
};

// Check Pending Approval
export const hasPendingApproval = async (policyId: string): Promise<boolean> => {
  const result = await pool.query(
    `SELECT id FROM policy_approvals WHERE policy_id = $1 AND status = 'PENDING'`,
    [policyId]
  );
  return result.rows.length > 0;
};
