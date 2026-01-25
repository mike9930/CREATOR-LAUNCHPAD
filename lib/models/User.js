import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const UserSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true }, // Optional - no OTP for phone
  
  // Email verification
  emailVerified: { type: Boolean, default: false },
  otpHash: { type: String }, // Hashed OTP for security
  otpExpires: { type: Date },
  otpAttempts: { type: Number, default: 0 }, // Track failed attempts
  otpLastSent: { type: Date }, // For rate limiting resends
  
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

// Remove the duplicate index - only use schema.index()
UserSchema.index({ role: 1 });
UserSchema.index({ phone: 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
