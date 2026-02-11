import "express";

declare global {
  namespace Express {
    interface User {
      userId: string;
      role: "SUPER_ADMIN" | "ADMIN" | "AUDITOR" | "DEPARTMENT";
      companyId?: string;
    }

    interface Request {
      user?: User;
    }
  }
}
