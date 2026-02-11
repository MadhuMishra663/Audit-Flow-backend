import { Schema, model, Types } from "mongoose";

const auditSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,

    company: {
      type: Types.ObjectId,
      ref: "Company",
      required: true,
    },

    department: {
      type: Types.ObjectId,
      ref: "Department",
      required: true,
    },

    auditor: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "ASSIGNED",
        "IN_PROGRESS",
        "SUBMITTED",
        "REVIEWED",
        "CLOSED",
      ],
      default: "ASSIGNED",
    },

    dueDate: Date,
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },

    createdBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    startedAt: Date,
    submittedAt: Date,
    reviewedAt: Date,
    completedAt: Date,
    closedAt: Date,
  },

  { timestamps: true },
);

export default model("Audit", auditSchema);
