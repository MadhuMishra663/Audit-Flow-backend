import { Request, Response } from "express";
import * as VersionDB from "../../../db/policy/policyVersions";
import * as AuditLogDB from "../../../db/policy/policyAuditLogs";
import { getPolicyById } from "../../../db/policy/policies";
// ============================================
// CREATE VERSION
// ============================================
export const createVersion = async (req: Request, res: Response) => {
  try {
    const { id: policyId } = req.params;
    const { change_log, file_id } = req.body;
    const createdBy = req.user!.userId;


    const policy = await getPolicyById(policyId);
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    const version = await VersionDB.createVersion({
      policy_id: policyId,
      change_log,
      file_id,
      created_by: createdBy,
    });


    await AuditLogDB.createAuditLog({
      policy_id: policyId,
      action: 'VERSION',
      performed_by: createdBy,
      new_data: version,
    });

    res.status(201).json({ success: true, version });
  } catch (error) {
    console.error("Create Version Error:", error);
    res.status(500).json({ message: "Failed to create version" });
  }
};

// ============================================
// GET ALL VERSIONS
// ============================================
export const getVersions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const versions = await VersionDB.getVersionsByPolicyId(id);

    res.status(200).json({
      success: true,
      count: versions.length,
      versions,
    });
  } catch (error) {
    console.error("Get Versions Error:", error);
    res.status(500).json({ message: "Failed to fetch versions" });
  }
};

// ============================================
// GET CURRENT VERSION
// ============================================
export const getCurrentVersion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const version = await VersionDB.getCurrentVersion(id);

    if (!version) {
      return res.status(404).json({ message: "No current version found" });
    }

    res.status(200).json({ success: true, version });
  } catch (error) {
    console.error("Get Current Version Error:", error);
    res.status(500).json({ message: "Failed to fetch current version" });
  }
};

// ============================================
// SET CURRENT VERSION
// ============================================
export const setCurrentVersion = async (req: Request, res: Response) => {
  try {
    const { id: policyId, versionId } = req.params;


    const version = await VersionDB.setCurrentVersion(policyId, versionId);
    if (!version) {
      return res.status(404).json({ message: "Version not found" });
    }

    res.status(200).json({ success: true, version });
  } catch (error) {
    console.error("Set Current Version Error:", error);
    res.status(500).json({ message: "Failed to set current version" });
  }
};

