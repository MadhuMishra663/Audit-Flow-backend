import { Schema, Types, model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["ADMIN", "AUDITOR", "DEPARTMENT"],
      default: "DEPARTMENT",
    },
    department: {
      type: Types.ObjectId,
      ref: "Department",
      required: function () {
        return this.role === "DEPARTMENT";
      },
    },
  },
  { timestamps: true },
);

export default model("User", userSchema);
