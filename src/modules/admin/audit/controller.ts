import { Request, Response } from "express";
import Audit from "../../../db/audits";
import Department from "../../../db/departments";
import User from "../../../db/users";
import { Types } from "mongoose";

export const createAudit = async (req: Request, res: Response) => {
  try {
    const { title, description, departmentId, auditorId, dueDate, priority } =
      req.body;

    if (!title || !departmentId || !auditorId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const companyId = req.user!.companyId;

    if (!companyId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Validate department
    const department = await Department.findOne({
      _id: departmentId,
      company: companyId,
    });
    if (!department) {
      return res.status(400).json({ message: "Invalid department" });
    }

    // Validate auditor
    const auditor = await User.findOne({
      _id: auditorId,
      role: "AUDITOR",
      company: companyId,
    });
    if (!auditor) {
      return res.status(400).json({ message: "Invalid auditor" });
    }

    const audit = await Audit.create({
      title,
      description,
      company: companyId,
      department: departmentId,
      auditor: auditorId,
      dueDate,
      priority,
      createdBy: req.user!.userId,
    });

    res.status(201).json({
      success: true,
      audit,
    });
  } catch {
    res.status(500).json({ message: "Failed to create audit" });
  }
};

export const updateAuditStatus = async (req: Request, res: Response) => {
  try {
    const { auditId, status } = req.body;
    const companyId = req.user?.companyId;
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!companyId || !userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!auditId || !Types.ObjectId.isValid(auditId)) {
      return res.status(400).json({ message: "Invalid audit id" });
    }

    const allowedStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "CLOSED"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const audit = await Audit.findOne({
      _id: new Types.ObjectId(auditId),
      company: new Types.ObjectId(companyId),
    });

    if (!audit) {
      return res.status(404).json({ message: "Audit not found" });
    }

    // 🔐 Auditor can update ONLY assigned audits
    if (role === "AUDITOR" && audit.auditor.toString() !== userId) {
      return res.status(403).json({
        message: "You are not assigned to this audit",
      });
    }

    // ❌ Prevent changes on closed audit
    if (audit.status === "CLOSED") {
      return res.status(400).json({
        message: "Closed audit cannot be modified",
      });
    }

    audit.status = status;

    // optional timestamps
    if (status === "IN_PROGRESS") audit.startedAt = new Date();
    if (status === "COMPLETED") audit.completedAt = new Date();

    await audit.save();

    res.json({
      success: true,
      message: "Audit status updated successfully",
      audit,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update audit status" });
  }
};

// GET /api/admin/audits
export const getCompanyAudits = async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  if (!companyId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const audits = await Audit.find({ company: companyId })
    .populate("department", "name")
    .populate("auditor", "name email");

  res.json({ success: true, audits });
};
// PATCH /api/admin/audits/:id/reassign
export const reassignAuditor = async (req: Request, res: Response) => {
  const { auditorId } = req.body;
  const companyId = req.user!.companyId;
  if (!companyId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  await Audit.updateOne(
    { _id: req.params.id, company: companyId },
    { auditor: auditorId },
  );

  res.json({ success: true });
};
