import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const AuditLogSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  userId: { type: String, required: true, ref: 'User' },
  action: { type: String, required: true }, // e.g., 'APPROVE_CONTESTANT', 'FREEZE_USER', 'CREATE_ROUND'
  targetType: { type: String }, // 'USER', 'CONTESTANT', 'ROUND', 'TRANSACTION', 'SETTINGS'
  targetId: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { _id: false, timestamps: false });

AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });
AuditLogSchema.index({ createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
