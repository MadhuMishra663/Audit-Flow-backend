// src/controllers/department/createDepartment.ts
import { Request, Response } from "express";
import Department from "../../../db/departments";
import User from "../../../db/users";
import { Types } from "mongoose";

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Department name is required" });
    }

    if (!req.user?.companyId) {
      return res.status(403).json({ message: "Company context missing" });
    }

    const companyId = req.user.companyId;

    const exists = await Department.findOne({ name, company: companyId });
    if (exists) {
      return res.status(409).json({ message: "Department already exists" });
    }

    const department = await Department.create({
      name,
      description,
      company: companyId,
    });

    res.status(201).json({
      success: true,
      department,
    });
  } catch {
    res.status(500).json({ message: "Failed to create department" });
  }
};

export const addMemberToDepartment = async (req: Request, res: Response) => {
  try {
    const { departmentId, userId } = req.body;

    if (!req.user?.companyId) {
      return res.status(403).json({ message: "Company context missing" });
    }

    const department = await Department.findOne({
      _id: departmentId,
      company: req.user.companyId,
    });

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    if (department.members.includes(userId)) {
      return res.status(400).json({ message: "User already added" });
    }

    department.members.push(userId);
    await department.save();

    res.json({ success: true, message: "Member added successfully" });
  } catch {
    res.status(500).json({ message: "Failed to add member" });
  }
};

export const getDepartments = async (req: Request, res: Response) => {
  try {
    if (!req.user?.companyId) {
      return res.status(403).json({ message: "Company context missing" });
    }

    const departments = await Department.find({
      company: req.user.companyId,
    }).select("_id name");

    res.status(200).json({
      success: true,
      departments,
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch departments" });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, description } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid department id" });
    }

    if (!req.user?.companyId) {
      return res.status(403).json({ message: "Company context missing" });
    }

    const companyId = new Types.ObjectId(req.user.companyId);

    await Department.updateOne(
      {
        _id: new Types.ObjectId(id),
        company: companyId,
      },
      {
        $set: {
          ...(name && { name }),
          ...(description && { description }),
        },
      },
    );

    res.json({ success: true, message: "Department updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update department" });
  }
};

// DELETE /api/admin/departments/:id
export const deleteDepartment = async (req: Request, res: Response) => {
  const { departmentId } = req.params;

  const companyId = req.user!.companyId;
  if (!departmentId || Array.isArray(departmentId)) {
    return res.status(400).json({ message: "Invalid department id" });
  }

  if (!companyId) {
    return res.status(403).json({ message: "Company context missing" });
  }
  const usersCount = await User.countDocuments({
    department: new Types.ObjectId(departmentId),
    company: new Types.ObjectId(companyId),
  });

  if (usersCount > 0) {
    return res
      .status(400)
      .json({ message: "Remove users before deleting department" });
  }

  await Department.deleteOne({
    _id: req.params.id,
    company: companyId,
  });

  res.json({ success: true });
};
