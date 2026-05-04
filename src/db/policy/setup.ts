// Policy Module Setup
// Creates all policy-related tables in PostgreSQL

import { pool } from "../../config/db";

export const createPolicyTables = async () => {
  console.log("\n🔧 Setting up Policy Management tables...");

  try {
    // Enable UUID extension
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // 1. Create policies table
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
      );
    `);
    console.log("  ✅ policies table created/verified");

    // 2. Create policy_files table
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
      );
    `);
    console.log("  ✅ policy_files table created/verified");

    // 3. Create policy_versions table
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
      );
    `);
    console.log("  ✅ policy_versions table created/verified");

    // 4. Create policy_approvals table
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
      );
    `);
    console.log("  ✅ policy_approvals table created/verified");


    // 5. Create controls table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS controls (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        framework VARCHAR(50) NOT NULL CHECK (framework IN ('SOC2', 'ISO27001', 'GDPR', 'HIPAA', 'PCI-DSS', 'NIST', 'OTHER')),
        control_code TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(framework, control_code)
      );
    `);
    console.log("  ✅ controls table created/verified");

    // 6. Create policy_control_mappings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS policy_control_mappings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
        control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(policy_id, control_id)
      );
    `);
    console.log("  ✅ policy_control_mappings table created/verified");


    // 7. Create policy_audit_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS policy_audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
        action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'UPLOAD', 'VERSION')),
        performed_by UUID NOT NULL,
        old_data JSONB,
        new_data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("  ✅ policy_audit_logs table created/verified");

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_policies_category ON policies(category);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_policies_owner ON policies(owner_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_policies_created_by ON policies(created_by);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_policy_versions_policy ON policy_versions(policy_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_policy_approvals_policy ON policy_approvals(policy_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_policy_approvals_approver ON policy_approvals(approver_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_policy_audit_logs_policy ON policy_audit_logs(policy_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_policy_audit_logs_action ON policy_audit_logs(action);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_policy_control_mappings_policy ON policy_control_mappings(policy_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_policy_control_mappings_control ON policy_control_mappings(control_id);`);
    console.log("  ✅ Indexes created/verified");

    // Create update trigger
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await pool.query(`
      DROP TRIGGER IF EXISTS update_policies_updated_at ON policies;
      CREATE TRIGGER update_policies_updated_at
        BEFORE UPDATE ON policies
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log("  ✅ Trigger created/verified");


    console.log("✅ Policy Management tables setup complete!\n");
  } catch (error) {
    console.error("❌ Failed to setup Policy tables:", error);
    throw error;
  }
};
