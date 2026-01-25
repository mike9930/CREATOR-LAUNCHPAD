import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const UserSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  phoneVerified: { type: Boolean, default: false },
  otpCode: { type: String },
  otpExpires: { type: Date },
  role: { type: String, enum: ['VOTER', 'CONTESTANT', 'ADMIN'], default: 'VOTER' },
  country: { type: String },
  avatar: { type: String },
  isActive: { type: Boolean, default: true },
  isFrozen: { type: Boolean, default: false },
  frozenReason: { type: String },
  frozenAt: { type: Date },
  frozenBy: { type: String },
  lastLoginAt: { type: Date },
  lastLoginIp: { type: String },
  lastLoginUserAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false, timestamps: true });

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ phone: 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
