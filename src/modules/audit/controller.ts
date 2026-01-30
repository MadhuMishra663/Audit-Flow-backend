// src/controllers/audit/createQuestion.ts
import { Request, Response } from "express";
import AuditQuestion from "../../db/auditQuestions";
import Department from "../../db/departments";
import Notification from "../../db/notifications";

export const createBulkAuditQuestions = async (req: Request, res: Response) => {
  try {
    const { departmentId, dueDate, questions } = req.body;
    const auditorId = req.user!.userId;

    if (!departmentId || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Invalid request body" });
    }

    const department =
      await Department.findById(departmentId).populate("members");
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    // Prepare audit questions
    const auditDocs = questions.map((q: any) => ({
      title: q.title,
      description: q.description,
      department: departmentId,
      createdBy: auditorId,
      dueDate,
    }));

    const createdQuestions = await AuditQuestion.insertMany(auditDocs);

    // Create notifications
    const notifications = [];
    for (const member of department.members as any[]) {
      for (const question of createdQuestions) {
        notifications.push({
          user: member._id,
          message: `New audit question assigned: ${question.title}`,
          relatedQuestion: question._id,
        });
      }
    }

    await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: "Bulk audit questions created",
      count: createdQuestions.length,
      questions: createdQuestions,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create bulk audit questions" });
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

export const submitDepartmentAnswer = async (req: Request, res: Response) => {
  try {
    const { questionId, departmentId } = req.body;

    // Find the question
    const question = await AuditQuestion.findById(questionId);
    if (!question)
      return res.status(404).json({ message: "Question not found" });

    // Find the department inside the question
    const dept = question.departments.find(
      (d) => d.department.toString() === departmentId,
    );

    if (!dept)
      return res.status(404).json({ message: "Department not assigned" });
    // Update department status
    dept.status = "SUBMITTED";

    // Update overall question status
    if (
      question.departments.every(
        (d) => d.status === "SUBMITTED" || d.status === "REVIEWED",
      )
    ) {
      question.status = "COMPLETE";
    } else {
      question.status = "PENDING";
    }

    await question.save();
    res.status(200).json({
      success: true,
      message: "Answer submitted successfully",
      question,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit answer" });
  }
};
