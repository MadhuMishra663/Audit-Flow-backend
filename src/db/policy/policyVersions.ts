import { pool } from "../../config/db";
import { v4 as uuidv4 } from "uuid";

export interface PolicyVersion {
  id: string;
  policy_id: string;
  version_number: number;
  change_log: string | null;
  file_id: string | null;
  created_by: string;
  created_at: Date;
  is_current: boolean;
}

// Create table
export const createPolicyVersionsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS policy_versions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
      version_number INT NOT NULL,
      change_log TEXT,
      file_id UUID REFERENCES policy_files(id) ON DELETE SET NULL,
      created_by UUID NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      is_current BOOLEAN DEFAULT FALSE,
      UNIQUE(policy_id, version_number)
    )
  `);
};

// Create Version
export const createVersion = async (data: {
  policy_id: string;
  change_log?: string;
  file_id?: string;
  created_by: string;
}): Promise<PolicyVersion> => {
  // Get next version number
  const versionResult = await pool.query(
    `SELECT COALESCE(MAX(version_number), 0) + 1 as next_version
     FROM policy_versions WHERE policy_id = $1`,
    [data.policy_id]
  );
  const nextVersion = versionResult.rows[0].next_version;

  // Reset all current versions
  await pool.query(
    `UPDATE policy_versions SET is_current = FALSE WHERE policy_id = $1`,
    [data.policy_id]
  );

  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO policy_versions (id, policy_id, version_number, change_log, file_id, created_by, is_current)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)
     RETURNING *`,
    [id, data.policy_id, nextVersion, data.change_log || null, data.file_id || null, data.created_by]
  );
  return result.rows[0];
};

// Get Versions by Policy ID
export const getVersionsByPolicyId = async (policyId: string): Promise<PolicyVersion[]> => {
  const result = await pool.query(
    `SELECT pv.*, u.name as created_by_name, pf.file_name, pf.file_path
     FROM policy_versions pv
     LEFT JOIN users u ON pv.created_by = u.id
     LEFT JOIN policy_files pf ON pv.file_id = pf.id
     WHERE pv.policy_id = $1
     ORDER BY pv.version_number DESC`,
    [policyId]
  );
  return result.rows;
};

// Get Current Version
export const getCurrentVersion = async (policyId: string): Promise<PolicyVersion | null> => {
  const result = await pool.query(
    `SELECT pv.*, u.name as created_by_name, pf.file_name, pf.file_path
     FROM policy_versions pv
     LEFT JOIN users u ON pv.created_by = u.id
     LEFT JOIN policy_files pf ON pv.file_id = pf.id
     WHERE pv.policy_id = $1 AND pv.is_current = TRUE`,
    [policyId]
  );
  return result.rows[0] || null;
};

// Set Current Version
export const setCurrentVersion = async (policyId: string, versionId: string): Promise<PolicyVersion | null> => {
  await pool.query(
    `UPDATE policy_versions SET is_current = FALSE WHERE policy_id = $1`,
    [policyId]
  );
  const result = await pool.query(
    `UPDATE policy_versions SET is_current = TRUE
     WHERE id = $1 AND policy_id = $2
     RETURNING *`,
    [versionId, policyId]
  );
  return result.rows[0] || null;
};
