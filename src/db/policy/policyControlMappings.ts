import { pool } from "../../config/db";
import { v4 as uuidv4 } from "uuid";

export interface PolicyControlMapping {
  id: string;
  policy_id: string;
  control_id: string;
  created_at: Date;
}

// Create table
export const createPolicyControlMappingsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS policy_control_mappings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
      control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(policy_id, control_id)
    )
  `);
};

// Map Policy to Control
export const createMapping = async (data: {
  policy_id: string;
  control_id: string;
}): Promise<PolicyControlMapping> => {
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO policy_control_mappings (id, policy_id, control_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [id, data.policy_id, data.control_id]
  );
  return result.rows[0];
};

// Get Controls by Policy ID
export const getControlsByPolicyId = async (policyId: string): Promise<any[]> => {
  const result = await pool.query(
    `SELECT c.*
     FROM controls c
     JOIN policy_control_mappings pcm ON c.id = pcm.control_id
     WHERE pcm.policy_id = $1
     ORDER BY c.framework, c.control_code`,
    [policyId]
  );
  return result.rows;
};

// Get Policies by Control ID
export const getPoliciesByControlId = async (controlId: string): Promise<any[]> => {
  const result = await pool.query(
    `SELECT p.*
     FROM policies p
     JOIN policy_control_mappings pcm ON p.id = pcm.policy_id
     WHERE pcm.control_id = $1 AND p.is_deleted = FALSE
     ORDER BY p.created_at DESC`,
    [controlId]
  );
  return result.rows;
};

// Delete Mapping
export const deleteMapping = async (policyId: string, controlId: string): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM policy_control_mappings 
     WHERE policy_id = $1 AND control_id = $2`,
    [policyId, controlId]
  );
  return (result.rowCount ?? 0) > 0;
};


// Check if Mapping Exists
export const mappingExists = async (policyId: string, controlId: string): Promise<boolean> => {
  const result = await pool.query(
    `SELECT id FROM policy_control_mappings WHERE policy_id = $1 AND control_id = $2`,
    [policyId, controlId]
  );
  return result.rows.length > 0;
};
