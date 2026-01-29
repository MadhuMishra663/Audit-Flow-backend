import { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user: {
        userId: Types.ObjectId | string;
        role: "ADMIN" | "AUDITOR" | "DEPARTMENT";
      };
    }
  }
}

export {};
