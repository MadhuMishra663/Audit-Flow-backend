import { pool } from "../../config/db";
import { v4 as uuidv4 } from "uuid";

export const CATEGORIES = ['SECURITY', 'PRIVACY', 'FINANCE', 'HR', 'OPERATIONS', 'IT', 'COMPLIANCE', 'OTHER'] as const;
export const STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;

export type Category = typeof CATEGORIES[number];
export type Status = typeof STATUSES[number];

export interface Policy {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  status: Status;
  owner_id: string | null;
  reviewer_id: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  last_review_date: Date | null;
  next_review_date: Date | null;
  review_frequency: string;
  is_deleted: boolean;
}

// Create table if not exists
export const createPoliciesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS policies (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      description TEXT,
      category VARCHAR(50) NOT NULL CHECK (category IN ('SECURITY', 'PRIVACY', 'FINANCE', 'HR', 'OPERATIONS', 'IT', 'COMPLIANCE', 'OTHER')),
      status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
      owner_id UUID,
      reviewer_id UUID,
      created_by UUID NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      last_review_date DATE,
      next_review_date DATE,
      review_frequency TEXT DEFAULT 'ANNUALLY',
      is_deleted BOOLEAN DEFAULT FALSE
    )
  `);
};

// Insert Policy
export const createPolicy = async (data: {
  title: string;
  description?: string;
  category: Category;
  owner_id?: string;
  reviewer_id?: string;
  created_by: string;
  review_frequency?: string;
  last_review_date?: Date;
  next_review_date?: Date;
}): Promise<Policy> => {
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO policies (id, title, description, category, owner_id, reviewer_id, created_by, review_frequency, last_review_date, next_review_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [id, data.title, data.description || null, data.category, data.owner_id || null, data.reviewer_id || null, data.created_by, data.review_frequency || 'ANNUALLY', data.last_review_date || null, data.next_review_date || null]
  );
  return result.rows[0];
};

// Get All Policies
export const getAllPolicies = async (filters?: {
  status?: Status;
  category?: Category;
  search?: string;
}): Promise<Policy[]> => {
  let query = `
    SELECT p.*,
      u1.name as owner_name, u1.email as owner_email,
      u2.name as reviewer_name, u2.email as reviewer_email,
      u3.name as created_by_name,
      pv.version_number as current_version
    FROM policies p
    LEFT JOIN users u1 ON p.owner_id = u1.id
    LEFT JOIN users u2 ON p.reviewer_id = u2.id
    LEFT JOIN users u3 ON p.created_by = u3.id
    LEFT JOIN LATERAL (
      SELECT version_number
      FROM policy_versions pv
      WHERE pv.policy_id = p.id AND pv.is_current = TRUE
      LIMIT 1
    ) pv ON true
    WHERE p.is_deleted = FALSE
  `;

  const values: any[] = [];
  let paramIndex = 1;

  if (filters?.status) {
    query += ` AND p.status = $${paramIndex++}`;
    values.push(filters.status);
  }
  if (filters?.category) {
    query += ` AND p.category = $${paramIndex++}`;
    values.push(filters.category);
  }
  if (filters?.search) {
    query += ` AND (p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
    values.push(`%${filters.search}%`);
  }

  query += ` ORDER BY p.created_at DESC`;
  const result = await pool.query(query, values);
  return result.rows;
};


// Get Policy by ID
export const getPolicyById = async (id: string): Promise<Policy | null> => {
  const result = await pool.query(
    `SELECT p.*,
      u1.name as owner_name, u1.email as owner_email,
      u2.name as reviewer_name, u2.email as reviewer_email,
      u3.name as created_by_name
     FROM policies p
     LEFT JOIN users u1 ON p.owner_id = u1.id
     LEFT JOIN users u2 ON p.reviewer_id = u2.id
     LEFT JOIN users u3 ON p.created_by = u3.id
     WHERE p.id = $1 AND p.is_deleted = FALSE`,
    [id]
  );
  return result.rows[0] || null;
};

// Update Policy
export const updatePolicy = async (id: string, updates: Partial<Policy>): Promise<Policy | null> => {
  const allowedFields = ['title', 'description', 'category', 'status', 'owner_id', 'reviewer_id', 'review_frequency', 'last_review_date', 'next_review_date'];
  const setClause: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (updates[field as keyof Policy] !== undefined) {
      setClause.push(`${field} = $${paramIndex++}`);
      values.push(updates[field as keyof Policy]);
    }
  }

  if (setClause.length === 0) return null;

  values.push(id);
  const result = await pool.query(
    `UPDATE policies SET ${setClause.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex} AND is_deleted = FALSE
     RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

// Delete Policy (Soft Delete)
export const deletePolicy = async (id: string): Promise<boolean> => {
  const result = await pool.query(
    `UPDATE policies SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1`,
    [id]
  );
  return (result.rowCount ?? 0) > 0;
};

// Archive Policy
export const archivePolicy = async (id: string): Promise<Policy | null> => {
  const result = await pool.query(
    `UPDATE policies SET status = 'ARCHIVED', updated_at = NOW()
     WHERE id = $1 AND is_deleted = FALSE
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};
