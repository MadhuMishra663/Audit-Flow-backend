// src/controllers/audit/createQuestion.ts
import { Request, Response } from "express";
import AuditQuestion from "../../db/auditQuestions";
import Department from "../../db/departments";
import Notification from "../../db/notifications";

export const createAuditQuestion = async (req: Request, res: Response) => {
  try {
    const { title, description, departmentId, dueDate } = req.body;
    const auditorId = req.user.userId; // from auth middleware

    if (!title || !departmentId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const department =
      await Department.findById(departmentId).populate("members");
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    const question = await AuditQuestion.create({
      title,
      description,
      department: departmentId,
      createdBy: auditorId,
      dueDate,
    });

    // Notify department members
    const notifications = department.members.map((member: any) => ({
      user: member._id,
      message: `New audit question assigned: ${title}`,
      relatedQuestion: question._id,
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: "Audit question created and department notified",
      question,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create audit question" });
  }
};

export const getMyDepartmentQuestions = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;

    const departments = await Department.find({ members: userId });

    const departmentIds = departments.map((d) => d._id);

    const questions = await AuditQuestion.find({
      department: { $in: departmentIds },
    }).sort({ createdAt: -1 });

    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch questions" });
  }
};
