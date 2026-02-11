import { Request, Response } from "express";
import User from "../../db/users";
import { Types } from "mongoose";

export const toggleUserStatus = async (req: Request, res: Response) => {
  const { userId, isActive } = req.body;

  if (!req.user?.companyId) {
    return res.status(403).json({ message: "Company context missing" });
  }

  const companyId = new Types.ObjectId(req.user.companyId);

  await User.updateOne(
    { _id: userId, company: req.user!.companyId },
    { isActive },
  );

  res.json({ success: true });
};
