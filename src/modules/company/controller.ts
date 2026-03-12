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

// src/modules/company/controller.ts

export const getAllCompanies = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT * 
      FROM companies
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      success: true,
      total: result.rows.length,
      companies: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch companies",
    });
  }
};

export const updateCompany = async (req: Request, res: Response) => {
  try {
    const { Id } = req.params;
    const updates = req.body;

    if (!Id) {
      return res.status(400).json({ message: "Company ID required" });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "At least one field required to update",
      });
    }

    const fields = Object.keys(updates);
    const values = Object.values(updates);

    const setQuery = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");

    const query = `
      UPDATE companies
      SET ${setQuery}, updated_at = NOW()
      WHERE id = $${fields.length + 1}
      RETURNING *
    `;

    const result = await pool.query(query, [...values, Id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({
      success: true,
      message: "Company updated successfully",
      company: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update company",
    });
  }
};

export const getSingleCompany = async (req: Request, res: Response) => {
  try {
    const { Id } = req.params;

    if (!Id) {
      return res.status(400).json({
        message: "Company ID is required",
      });
    }

    const result = await pool.query(`SELECT * FROM companies WHERE id = $1`, [
      Id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      company: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch company",
    });
  }
};
