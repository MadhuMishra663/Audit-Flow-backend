import { pool } from "../../config/db";
import { v4 as uuidv4 } from "uuid";

export interface PolicyFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  checksum: string | null;
  uploaded_by: string;
  uploaded_at: Date;
  is_active: boolean;
}

// Create table
export const createPolicyFilesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS policy_files (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size BIGINT,
      mime_type TEXT,
      checksum TEXT,
      uploaded_by UUID NOT NULL,
      uploaded_at TIMESTAMPTZ DEFAULT NOW(),
      is_active BOOLEAN DEFAULT TRUE
    )
  `);
};

// Create File Record
export const createPolicyFile = async (data: {
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  checksum: string;
  uploaded_by: string;
}): Promise<PolicyFile> => {
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO policy_files (id, file_name, file_path, file_size, mime_type, checksum, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [id, data.file_name, data.file_path, data.file_size, data.mime_type, data.checksum, data.uploaded_by]
  );
  return result.rows[0];
};

// Get Files by Policy ID
export const getFilesByPolicyId = async (policyId: string): Promise<PolicyFile[]> => {
  const result = await pool.query(
    `SELECT pf.*, u.name as uploaded_by_name
     FROM policy_files pf
     LEFT JOIN users u ON pf.uploaded_by = u.id
     WHERE pf.id IN (
       SELECT pv.file_id FROM policy_versions pv WHERE pv.policy_id = $1 AND pv.file_id IS NOT NULL
     )
     ORDER BY pf.uploaded_at DESC`,
    [policyId]
  );
  return result.rows;
};

// Get File by ID
export const getFileById = async (id: string): Promise<PolicyFile | null> => {
  const result = await pool.query(
    `SELECT pf.*, u.name as uploaded_by_name
     FROM policy_files pf
     LEFT JOIN users u ON pf.uploaded_by = u.id
     WHERE pf.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

// Soft Delete File
export const deletePolicyFile = async (id: string): Promise<boolean> => {
  const result = await pool.query(
    `UPDATE policy_files SET is_active = FALSE WHERE id = $1`,
    [id]
  );
  return (result.rowCount ?? 0) > 0;
};
