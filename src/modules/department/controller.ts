// src/controllers/department/createDepartment.ts
import { Request, Response } from "express";
import Department from "../../db/departments";

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Department name is required" });
    }

    const exists = await Department.findOne({ name });
    if (exists) {
      return res.status(409).json({ message: "Department already exists" });
    }

    const department = await Department.create({ name, description });

    res.status(201).json({
      success: true,
      department,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create department" });
  }
};

export const addMemberToDepartment = async (req: Request, res: Response) => {
  try {
    const { departmentId, userId } = req.body;

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    if (department.members.includes(userId)) {
      return res.status(400).json({ message: "User already added" });
    }

    department.members.push(userId);
    await department.save();

    res.json({
      success: true,
      message: "Member added successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add member" });
  }
};
