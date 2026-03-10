// src/modules/company/controller.ts
import { Request, Response } from "express";
import { pool } from "../../config/db";

export const createCompany = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Company name required" });
    }

    const result = await pool.query(
      `INSERT INTO companies (name)
       VALUES ($1)
       RETURNING *`,
      [name],
    );

    const company = result.rows[0];

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

    // 🔒 Safety checks (same logic as Mongo)
    const usersCountResult = await pool.query(
      `SELECT COUNT(*) FROM users WHERE company_id=$1`,
      [companyId],
    );

    const departmentsCountResult = await pool.query(
      `SELECT COUNT(*) FROM departments WHERE company_id=$1`,
      [companyId],
    );

    const auditsCountResult = await pool.query(
      `SELECT COUNT(*) FROM audits WHERE company_id=$1`,
      [companyId],
    );

    const usersCount = Number(usersCountResult.rows[0].count);
    const departmentsCount = Number(departmentsCountResult.rows[0].count);
    const auditsCount = Number(auditsCountResult.rows[0].count);

    if (usersCount > 0 || departmentsCount > 0 || auditsCount > 0) {
      return res.status(400).json({
        message:
          "Delete users, departments, and audits before deleting company",
      });
    }

    await pool.query(`DELETE FROM companies WHERE id=$1`, [companyId]);

    res.json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete company" });
  }
};
