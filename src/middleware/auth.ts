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

    req.user = decoded; // ✅ TS now accepts this
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
