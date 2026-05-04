import { Request, Response } from "express";
import * as ApprovalDB from "../../../db/policy/policyApprovals";
import * as AuditLogDB from "../../../db/policy/policyAuditLogs";
import * as PolicyDB from "../../../db/policy/policies";
import { pool } from "../../../config/db";
// ============================================
// SUBMIT FOR APPROVAL
// ============================================
export const submitForApproval = async (req: Request, res: Response) => {
  try {
    const { id: policyId } = req.params;
    const { approver_id, version_id, comments } = req.body;
    const performedBy = req.user!.userId;

    const policy = await PolicyDB.getPolicyById(policyId);
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }


    if (!approver_id) {
      return res.status(400).json({ message: "Approver ID is required" });
    }

    const hasPending = await ApprovalDB.hasPendingApproval(policyId);
    if (hasPending) {
      return res.status(400).json({ message: "There is already a pending approval for this policy" });
    }


    const approval = await ApprovalDB.createApproval({
      policy_id: policyId,
      version_id,
      approver_id,
      comments,
    });

    await AuditLogDB.createAuditLog({
      policy_id: policyId,
      action: 'UPDATE',
      performed_by: performedBy,
      new_data: { action: 'SUBMITTED_FOR_APPROVAL', approver_id },
    });


    res.status(201).json({ success: true, approval });
  } catch (error) {
    console.error("Submit For Approval Error:", error);
    res.status(500).json({ message: "Failed to submit for approval" });
  }
};

// ============================================
// GET APPROVALS FOR POLICY
// ============================================
export const getApprovals = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const approvals = await ApprovalDB.getApprovalsByPolicyId(id);

    res.status(200).json({
      success: true,
      count: approvals.length,
      approvals,
    });
  } catch (error) {
    console.error("Get Approvals Error:", error);
    res.status(500).json({ message: "Failed to fetch approvals" });
  }
};

// ============================================
// GET PENDING APPROVALS
// ============================================
export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    const approvals = await ApprovalDB.getPendingApprovals();
    res.status(200).json({
      success: true,
      count: approvals.length,
      approvals,
    });
  } catch (error) {
    console.error("Get Pending Approvals Error:", error);
    res.status(500).json({ message: "Failed to fetch pending approvals" });
  }
};

// ============================================
// APPROVE POLICY
// ============================================
export const approvePolicy = async (req: Request, res: Response) => {
  try {
    const { approvalId } = req.params;
    const { comments } = req.body;
    const performedBy = req.user!.userId;

    const approval = await ApprovalDB.approvePolicy(approvalId, comments);
    if (!approval) {
      return res.status(404).json({ message: "Approval not found or already processed" });
    }

    await PolicyDB.updatePolicy(approval.policy_id, { status: 'ACTIVE' });

    await AuditLogDB.createAuditLog({
      policy_id: approval.policy_id,
      action: 'APPROVE',
      performed_by: performedBy,
      new_data: { approval_id: approvalId, status: 'APPROVED' },
    });

    res.status(200).json({ success: true, approval });
  } catch (error) {
    console.error("Approve Policy Error:", error);
    res.status(500).json({ message: "Failed to approve policy" });
  }
};

// ============================================
// REJECT POLICY
// ============================================
export const rejectPolicy = async (req: Request, res: Response) => {
  try {
    const { approvalId } = req.params;
    const { comments } = req.body;
    const performedBy = req.user!.userId;

    if (!comments) {
      return res.status(400).json({ message: "Comments are required for rejection" });
    }

    const approval = await ApprovalDB.rejectPolicy(approvalId, comments);
    if (!approval) {
      return res.status(404).json({ message: "Approval not found or already processed" });
    }

    await AuditLogDB.createAuditLog({
      policy_id: approval.policy_id,
      action: 'REJECT',
      performed_by: performedBy,
      new_data: { approval_id: approvalId, status: 'REJECTED', comments },
    });


    res.status(200).json({ success: true, approval });
  } catch (error) {
    console.error("Reject Policy Error:", error);
    res.status(500).json({ message: "Failed to reject policy" });
  }
};

