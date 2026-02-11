import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../db/users";
import Department from "../../db/departments";

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */

//this route is for company admin to create users under their company
export const companyAdminRegister = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, departmentId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedRole = role.toUpperCase();

    const allowedRoles = ["AUDITOR", "DEPARTMENT"];
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    if (normalizedRole === "DEPARTMENT" && !departmentId) {
      return res.status(400).json({
        success: false,
        message: "Department required for department user",
      });
    }
    if (!req.user?.companyId) {
      return res.status(403).json({
        success: false,
        message: "Company context missing",
      });
    }

    const existingUser = await User.findOne({
      email,
      company: req.user!.companyId,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists in company",
      });
    }

    if (departmentId) {
      const department = await Department.findOne({
        _id: departmentId,
        company: req.user!.companyId,
      });

      if (!department) {
        return res.status(400).json({
          success: false,
          message: "Invalid department",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    if (!req.user?.companyId) {
      return res.status(403).json({
        success: false,
        message: "Company context missing",
      });
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: normalizedRole,
      department: departmentId,
      company: req.user!.companyId,
    });

    if (normalizedRole === "DEPARTMENT" && departmentId) {
      await Department.updateOne(
        { _id: departmentId, company: req.user!.companyId },
        { $addToSet: { members: user._id } },
      );
    }

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "User creation failed",
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is disabled",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        companyId: user.company,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" },
    );

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction, // HTTPS only in prod
      sameSite: isProduction ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role, // ❗ KEEP AS IS
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const createCompanyAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password, companyId } = req.body;

    if (!name || !email || !password || !companyId) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",
      company: companyId,
    });

    res.status(201).json({
      success: true,
      message: "Company admin created",
      admin: {
        id: admin._id,
        email: admin.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Admin creation failed" });
  }
};

// GET /api/auth/me
export const me = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const user = await User.findById(req.user.userId).select("-password");

  res.json({
    success: true,
    user,
  });
};
