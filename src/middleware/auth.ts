// src/middlewares/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as Express.User;

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export const allowAuditor = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== "AUDITOR") {
    return res.status(403).json({ message: "Auditor access required" });
  }
  next();
};

export const allowRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};
export const requireCompany = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== "SUPER_ADMIN" && !req.user?.companyId) {
    return res.status(403).json({ message: "Company access required" });
  }
  next();
};
