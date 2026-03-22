import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../../../config/db";

export const createUserByAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, department_id } = req.body;

    // 1. Required fields
    if (!name || !email || !password || !role || !department_id) {
      return res.status(400).json({
        message: "All fields including department_id are required",
      });
    }

    // 2. Only ADMIN allowed
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ message: "Only ADMIN can create users" });
    }

    // 3. Role restriction (optional)
    if (!["AUDITOR", "DEPARTMENT"].includes(role)) {
      return res.status(400).json({
        message: "Admin can only create AUDITOR or DEPARTMENT users",
      });
    }

    const companyId = req.user.companyId;

    // 4. Check existing user
    const existing = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND company_id = $2",
      [email, companyId],
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: "User already exists in company",
      });
    }

    // 5. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Insert user
    await pool.query(
      `INSERT INTO users (name, email, password, role, company_id, department_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, email, hashedPassword, role, companyId, department_id || null],
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create user" });
  }
};
