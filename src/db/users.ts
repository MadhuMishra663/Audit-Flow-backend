import { Schema, Types, model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "AUDITOR", "DEPARTMENT"],
      default: "DEPARTMENT",
    },
    company: {
      type: Types.ObjectId,
      ref: "Company",
      required: function () {
        return this.role !== "SUPER_ADMIN";
      },
    },
    department: {
      type: Types.ObjectId,
      ref: "Department",
      required: function () {
        return this.role === "DEPARTMENT";
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },

  { timestamps: true },
);

export default model("User", userSchema);
