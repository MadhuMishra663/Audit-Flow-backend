// src/controllers/department/createDepartment.ts
import { Request, Response } from "express";
import Department from "../../../db/departments";
import User from "../../../db/users";
import { Types } from "mongoose";
import { pool } from "../../../config/db";
import { validate as isUUID } from "uuid";

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    // 1. Validation
    if (!name) {
      return res.status(400).json({
        message: "Department name is required",
      });
    }

    // 2. Company check
    if (!req.user?.companyId) {
      return res.status(403).json({
        message: "Company context missing",
      });
    }

    const companyId = req.user.companyId;

    const existing = await pool.query(
      `SELECT * FROM departments WHERE name = $1 AND company_id = $2`,
      [name, companyId],
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: "Department already exists",
      });
    }

    // 4. Insert department
    const result = await pool.query(
      `INSERT INTO departments (name, description, company_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description || null, companyId],
    );

    // 5. Response
    res.status(201).json({
      success: true,
      department: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to create department",
    });
  }
};

// export const addMemberToDepartment = async (req: Request, res: Response) => {
//   try {
//     const { departmentId, userId } = req.body;

//     if (!req.user?.companyId) {
//       return res.status(403).json({ message: "Company context missing" });
//     }

//     const department = await Department.findOne({
//       _id: departmentId,
//       company: req.user.companyId,
//     });

//     if (!department) {
//       return res.status(404).json({ message: "Department not found" });
//     }

//     if (department.members.includes(userId)) {
//       return res.status(400).json({ message: "User already added" });
//     }

//     department.members.push(userId);
//     await department.save();

//     res.json({ success: true, message: "Member added successfully" });
//   } catch {
//     res.status(500).json({ message: "Failed to add member" });
//   }
// };

export const getDepartments = async (req: Request, res: Response) => {
  try {
    // 1. Company check
    if (!req.user?.companyId) {
      return res.status(403).json({
        message: "Company context missing",
      });
    }

    const companyId = req.user.companyId;

    // 2. Fetch departments
    const result = await pool.query(
      `SELECT id, name FROM departments WHERE company_id = $1 ORDER BY name ASC`,
      [companyId],
    );

    // 3. Response
    res.status(200).json({
      success: true,
      departments: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch departments",
    });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { name, description } = req.body;

    if (!isUUID(id)) {
      return res.status(400).json({ message: "Invalid department id" });
    }

    // 2. Company check
    if (!req.user?.companyId) {
      return res.status(403).json({ message: "Company context missing" });
    }

    const companyId = req.user.companyId;

    // 3. Update dynamically (same logic as Mongo $set)
    await pool.query(
      `UPDATE departments
       SET 
         name = COALESCE($1, name),
         description = COALESCE($2, description)
       WHERE id = $3 AND company_id = $4`,
      [name || null, description || null, id, companyId],
    );

    res.json({
      success: true,
      message: "Department updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update department",
    });
  }
};

// DELETE /api/admin/departments/:id
export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Validate ID
    if (!isUUID(id)) {
      return res.status(400).json({ message: "Invalid department id" });
    }

    const companyId = req.user?.companyId;

    // 2. Company check
    if (!companyId) {
      return res.status(403).json({
        message: "Company context missing",
      });
    }

    // 3. Check users in department
    const usersCheck = await pool.query(
      `SELECT COUNT(*) FROM users 
       WHERE department_id = $1 AND company_id = $2`,
      [id, companyId],
    );

    const usersCount = parseInt(usersCheck.rows[0].count, 10);

    if (usersCount > 0) {
      return res.status(400).json({
        message: "Remove users before deleting department",
      });
    }

    // 4. Delete department
    await pool.query(
      `DELETE FROM departments 
       WHERE id = $1 AND company_id = $2`,
      [id, companyId],
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to delete department",
    });
  }
};
