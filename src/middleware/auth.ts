// src/middlewares/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      role: "ADMIN" | "AUDITOR" | "DEPARTMENT";
    };
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
  console.log("ALLOW AUDITOR:", req.user);
  if (req.user?.role !== "AUDITOR") {
    return res.status(403).json({ message: "Auditor access required" });
  }
  next();
};
