import { Schema, Types, model } from "mongoose";

const companySchema = new Schema(
  {
    name: { type: String, required: true },
    email: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default model("Company", companySchema);
