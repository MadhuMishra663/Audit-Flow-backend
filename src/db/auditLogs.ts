import { Schema, model, Types } from "mongoose";

const auditLogSchema = new Schema(
  {
    company: Types.ObjectId,
    actor: Types.ObjectId,
    action: String,
    entity: String,
    entityId: Types.ObjectId,
    meta: Object,
  },
  { timestamps: true },
);

export default model("AuditLog", auditLogSchema);
