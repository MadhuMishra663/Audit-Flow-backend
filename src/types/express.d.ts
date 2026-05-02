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
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }
  }
}
export {};
