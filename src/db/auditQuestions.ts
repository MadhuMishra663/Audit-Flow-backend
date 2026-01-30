// src/db/auditQuestion.ts
import { Schema, model, Types } from "mongoose";

const auditQuestionSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    departments: [
      {
        department: { type: Types.ObjectId, ref: "Department", required: true },
        status: {
          type: String,
          enum: ["PENDING", "SUBMITTED", "REVIEWED"],
          default: "PENDING",
        },
      },
    ],
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETE"],
      default: "PENDING",
    },
  },
  { timestamps: true },
);

export default model("AuditQuestion", auditQuestionSchema);
