import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../../../db/users";
import { Types } from "mongoose";

type UserFilter = {
  company: Types.ObjectId;
  role?: "SUPER_ADMIN" | "ADMIN" | "AUDITOR" | "DEPARTMENT";
  department?: Types.ObjectId;
  isActive?: boolean;
};
export const createUserByAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    //  ADMIN cannot create ADMIN
    if (!["AUDITOR"].includes(role)) {
      return res.status(400).json({ message: "Only AUDITOR can be created" });
    }

    if (!req.user?.companyId) {
      return res.status(403).json({ message: "Company context missing" });
    }

    const companyId = req.user.companyId;

    const existingUser = await User.findOne({ email, company: companyId });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User already exists in company" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      company: companyId,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
    });
  } catch {
    res.status(500).json({ message: "Failed to create user" });
  }
};

// GET /api/admin/users
export const getCompanyUsers = async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { role, department, isActive } = req.query;

    const filter: UserFilter = {
      company: new Types.ObjectId(companyId),
    };

    if (
      role === "SUPER_ADMIN" ||
      role === "ADMIN" ||
      role === "AUDITOR" ||
      role === "DEPARTMENT"
    ) {
      filter.role = role;
    }

    if (typeof department === "string" && Types.ObjectId.isValid(department)) {
      filter.department = new Types.ObjectId(department);
    }

    if (typeof isActive === "string") {
      filter.isActive = isActive === "true";
    }

    const users = await User.find(filter)
      .select("-password")
      .populate("department", "name");

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { isActive } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be boolean" });
    }

    if (!req.user?.companyId) {
      return res.status(403).json({ message: "Company context missing" });
    }

    const companyId = new Types.ObjectId(req.user.companyId);

    await User.updateOne(
      {
        _id: new Types.ObjectId(id),
        company: companyId,
      },
      { $set: { isActive } },
    );

    res.json({ success: true, message: "User status updated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update user" });
  }
};
