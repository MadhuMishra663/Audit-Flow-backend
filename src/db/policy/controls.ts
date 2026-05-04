import { pool } from "../../config/db";
import { v4 as uuidv4 } from "uuid";

export const FRAMEWORKS = ['SOC2', 'ISO27001', 'GDPR', 'HIPAA', 'PCI-DSS', 'NIST', 'OTHER'] as const;
export type Framework = typeof FRAMEWORKS[number];

export interface Control {
  id: string;
  framework: Framework;
  control_code: string;
  description: string | null;
  created_at: Date;
}

// Create table
export const createControlsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS controls (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      framework VARCHAR(50) NOT NULL CHECK (framework IN ('SOC2', 'ISO27001', 'GDPR', 'HIPAA', 'PCI-DSS', 'NIST', 'OTHER')),
      control_code TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(framework, control_code)
    )
  `);
};

// Create Control
export const createControl = async (data: {
  framework: Framework;
  control_code: string;
  description?: string;
}): Promise<Control> => {
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO controls (id, framework, control_code, description)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id, data.framework, data.control_code, data.description || null]
  );
  return result.rows[0];
};

// Get All Controls
export const getAllControls = async (filters?: {
  framework?: Framework;
  search?: string;
}): Promise<Control[]> => {
  let query = `SELECT * FROM controls WHERE 1=1`;
  const values: any[] = [];
  let paramIndex = 1;

  if (filters?.framework) {
    query += ` AND framework = $${paramIndex++}`;
    values.push(filters.framework);
  }
  if (filters?.search) {
    query += ` AND (control_code ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
    values.push(`%${filters.search}%`);
  }

  query += ` ORDER BY framework, control_code`;
  const result = await pool.query(query, values);
  return result.rows;
};

// Get Control by ID
export const getControlById = async (id: string): Promise<Control | null> => {
  const result = await pool.query(
    `SELECT c.*, 
      (SELECT COUNT(*) FROM policy_control_mappings WHERE control_id = c.id)::int as mapped_policies_count
     FROM controls c
     WHERE c.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

// Get Control by Framework and Code
export const getControlByFrameworkAndCode = async (framework: Framework, controlCode: string): Promise<Control | null> => {
  const result = await pool.query(
    `SELECT * FROM controls WHERE framework = $1 AND control_code = $2`,
    [framework, controlCode]
  );
  return result.rows[0] || null;
};
