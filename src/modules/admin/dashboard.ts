import { Request, Response } from "express";
import Audit from "../../db/audits";
import User from "../../db/users";
import { Types } from "mongoose";

export const adminDashboard = async (req: Request, res: Response) => {
  try {
    if (!req.user?.companyId) {
      return res.status(403).json({ message: "Company context missing" });
    }

    const companyId = new Types.ObjectId(req.user.companyId);
    const today = new Date();

    const [
      totalAudits,
      activeAudits,
      closedAudits,
      overdueAudits,
      auditors,
      employees,
      statusBreakdown,
    ] = await Promise.all([
      Audit.countDocuments({ company: companyId }),

      Audit.countDocuments({
        company: companyId,
        status: { $ne: "CLOSED" },
      }),

      Audit.countDocuments({
        company: companyId,
        status: "CLOSED",
      }),

      Audit.countDocuments({
        company: companyId,
        status: { $ne: "CLOSED" },
        dueDate: { $lt: today },
      }),

      User.countDocuments({
        company: companyId,
        role: "AUDITOR",
        isActive: true,
      }),

      User.countDocuments({
        company: companyId,
        role: "DEPARTMENT",
        isActive: true,
      }),

      Audit.aggregate([
        { $match: { company: companyId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const completionRate =
      totalAudits === 0 ? 0 : Math.round((closedAudits / totalAudits) * 100);

    res.json({
      success: true,
      data: {
        stats: {
          totalAudits,
          activeAudits,
          closedAudits,
          overdueAudits,
          completionRate,
          auditors,
          departmentUsers: employees,
        },
        statusBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load dashboard" });
  }
};
