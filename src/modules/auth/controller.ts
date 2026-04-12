import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../../config/db";

/**
 * @desc Register new user
 * @route POST /api/auth/register
 */

export const createSuperAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password, secret } = req.body;

    if (!name || !email || !password || !secret) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check secret key
    if (secret !== process.env.SUPER_ADMIN_SECRET) {
      return res.status(403).json({
        success: false,
        message: "Invalid secret key",
      });
    }

    // check if super admin already exists
    const existingSuperAdmin = await pool.query(
      `SELECT id FROM users WHERE role='SUPER_ADMIN'`,
    );

    if (existingSuperAdmin.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Super admin already exists",
      });
    }

    // check if email exists
    const existingUser = await pool.query(
      `SELECT id FROM users WHERE email=$1`,
      [email],
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name,email,password,role)
       VALUES ($1,$2,$3,'SUPER_ADMIN')
       RETURNING id,name,email,role`,
      [name, email, hashedPassword],
    );

    const user = result.rows[0];

    res.status(201).json({
      success: true,
      message: "Super Admin created successfully",
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Super admin creation failed",
    });
  }
};
// company admin creates users
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

    const existingUser = await pool.query(
      `SELECT id FROM users WHERE email=$1 AND company_id=$2`,
      [email, req.user.companyId],
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User already exists in company",
      });
    }

    if (departmentId) {
      const department = await pool.query(
        `SELECT id FROM departments WHERE id=$1 AND company_id=$2`,
        [departmentId, req.user.companyId],
      );

      if (department.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid department",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name,email,password,role,department_id,company_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id,name,email,role`,
      [
        name,
        email,
        hashedPassword,
        normalizedRole,
        departmentId || null,
        req.user.companyId,
      ],
    );

    const user = result.rows[0];

    if (normalizedRole === "DEPARTMENT" && departmentId) {
      await pool.query(
        `INSERT INTO department_members (department_id,user_id)
         VALUES ($1,$2)
         ON CONFLICT DO NOTHING`,
        [departmentId, user.id],
      );
    }

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user.id,
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
 * LOGIN
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

    const result = await pool.query(`SELECT * FROM users WHERE email=$1`, [
      email,
    ]);

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.is_active) {
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
        userId: user.id,
        role: user.role,
        companyId: user.company_id,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" },
    );

    const isProduction = process.env.NODE_ENV === "production";

    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: isProduction, // 🔥 prod me true, local me false
    //   sameSite: isProduction ? "none" : "lax", // 🔥 important
    //   path: "/",
    // });
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // Must be true in production (requires HTTPS)
      sameSite: "none", // Critical for cross-site cookies
      maxAge: 3600000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.company_id,
        },
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

    const exists = await pool.query(`SELECT id FROM users WHERE email=$1`, [
      email,
    ]);

    if (exists.rows.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name,email,password,role,company_id)
       VALUES ($1,$2,$3,'ADMIN',$4)
       RETURNING id,email`,
      [name, email, hashedPassword, companyId],
    );

    const admin = result.rows[0];

    res.status(201).json({
      success: true,
      message: "Company admin created",
      admin: {
        id: admin.id,
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

  const result = await pool.query(
    `SELECT id,name,email,role FROM users WHERE id=$1`,
    [req.user.userId],
  );

  const user = result.rows[0];

  res.json({
    success: true,
    user,
  });
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
