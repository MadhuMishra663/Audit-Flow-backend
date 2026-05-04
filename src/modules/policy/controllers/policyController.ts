import { Request, Response } from "express";
import * as PolicyDB from "../../../db/policy/policies";
import * as AuditLogDB from "../../../db/policy/policyAuditLogs";
import { getVersionsByPolicyId } from "../../../db/policy/policyVersions";
import { getControlsByPolicyId } from "../../../db/policy/policyControlMappings";
import { getApprovalsByPolicyId } from "../../../db/policy/policyApprovals";
// ============================================
// CREATE POLICY
// ============================================
export const createPolicy = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      owner_id,
      reviewer_id,
      review_frequency,
      last_review_date,
      next_review_date,
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({ message: "Title and category are required" });
    }

    if (!PolicyDB.CATEGORIES.includes(category)) {
      return res.status(400).json({ message: `Invalid category. Must be one of: ${PolicyDB.CATEGORIES.join(', ')}` });
    }

    const createdBy = req.user!.userId;

    const policy = await PolicyDB.createPolicy({
      title,
      description,
      category,
      owner_id,
      reviewer_id,
      created_by: createdBy,
      review_frequency,
      last_review_date,
      next_review_date,
    });

    await AuditLogDB.createAuditLog({
      policy_id: policy.id,
      action: 'CREATE',
      performed_by: createdBy,
      new_data: policy,
    });

    res.status(201).json({ success: true, policy });
  } catch (error) {
    console.error("Create Policy Error:", error);
    res.status(500).json({ message: "Failed to create policy" });
  }
};

// ============================================
// GET ALL POLICIES
// ============================================
export const getAllPolicies = async (req: Request, res: Response) => {
  try {
    const { status, category, search } = req.query;

    const policies = await PolicyDB.getAllPolicies({
      status: status as any,
      category: category as any,
      search: search as string,
    });
    res.status(200).json({
      success: true,
      count: policies.length,
      policies,
    });
  } catch (error) {
    console.error("Get Policies Error:", error);
    res.status(500).json({ message: "Failed to fetch policies" });
  }
};

// ============================================
// GET POLICY BY ID
// ============================================
export const getPolicyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const policy = await PolicyDB.getPolicyById(id);

    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    const [versions, controls, approvals] = await Promise.all([
      getVersionsByPolicyId(id),
      getControlsByPolicyId(id),
      getApprovalsByPolicyId(id),
    ]);
    res.status(200).json({
      success: true,
      policy: {
        ...policy,
        versions,
        controls,
        approvals,
      },
    });
  } catch (error) {
    console.error("Get Policy By ID Error:", error);
    res.status(500).json({ message: "Failed to fetch policy" });
  }
};

// ============================================
// UPDATE POLICY
// ============================================
export const updatePolicy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const performedBy = req.user!.userId;

    const oldPolicy = await PolicyDB.getPolicyById(id);
    if (!oldPolicy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    const updatedPolicy = await PolicyDB.updatePolicy(id, updates);
    if (!updatedPolicy) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    await AuditLogDB.createAuditLog({
      policy_id: id,
      action: 'UPDATE',
      performed_by: performedBy,
      old_data: oldPolicy,
      new_data: updatedPolicy,
    });

    res.status(200).json({ success: true, policy: updatedPolicy });
  } catch (error) {
    console.error("Update Policy Error:", error);
    res.status(500).json({ message: "Failed to update policy" });
  }
};

// ============================================
// DELETE POLICY (Soft Delete)
// ============================================
export const deletePolicy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const performedBy = req.user!.userId;

    const oldPolicy = await PolicyDB.getPolicyById(id);
    if (!oldPolicy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    await PolicyDB.deletePolicy(id);

    await AuditLogDB.createAuditLog({
      policy_id: id,
      action: 'DELETE',
      performed_by: performedBy,
      old_data: oldPolicy,
    });
    res.status(200).json({ success: true, message: "Policy deleted successfully" });
  } catch (error) {
    console.error("Delete Policy Error:", error);
    res.status(500).json({ message: "Failed to delete policy" });
  }
};

// ============================================
// ARCHIVE POLICY
// ============================================
export const archivePolicy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const performedBy = req.user!.userId;

    const policy = await PolicyDB.archivePolicy(id);
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    await AuditLogDB.createAuditLog({
      policy_id: id,
      action: 'UPDATE',
      performed_by: performedBy,
      old_data: { status: 'ACTIVE' },
      new_data: { status: 'ARCHIVED' },
    });

    res.status(200).json({ success: true, policy });
  } catch (error) {
    console.error("Archive Policy Error:", error);
    res.status(500).json({ message: "Failed to archive policy" });
  }
};

