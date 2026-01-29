// src/db/notification.ts
import { Schema, model, Types } from "mongoose";

const notificationSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedQuestion: {
      type: Types.ObjectId,
      ref: "AuditQuestion",
    },
  },
  { timestamps: true },
);

export default model("Notification", notificationSchema);
