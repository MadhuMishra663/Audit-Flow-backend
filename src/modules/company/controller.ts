// src/modules/company/controller.ts
import { Request, Response } from "express";
import Company from "../../db/companies";
import User from "../../db/users";
import Department from "../../db/departments";
import Audit from "../../db/audits";
import { Types } from "mongoose";

export const createCompany = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Company name required" });
    }

    const company = await Company.create({ name });

    res.status(201).json({
      success: true,
      company,
    });
  } catch (err) {
    res.status(500).json({ message: "Company creation failed" });
  }
};

export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({ message: "Invalid company id" });
    }

    // 🔒 Safety checks
    const usersCount = await User.countDocuments({ company: companyId });
    const departmentsCount = await Department.countDocuments({
      company: companyId,
    });
    const auditsCount = await Audit.countDocuments({
      company: companyId,
    });

    if (usersCount > 0 || departmentsCount > 0 || auditsCount > 0) {
      return res.status(400).json({
        message:
          "Delete users, departments, and audits before deleting company",
      });
    }

    await Company.deleteOne({ _id: companyId });

    res.json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete company" });
  }
};
