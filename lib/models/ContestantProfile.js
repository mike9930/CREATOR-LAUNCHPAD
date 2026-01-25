import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const ContestantProfileSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  userId: { type: String, required: true, ref: 'User' },
  stageName: { type: String, required: true, trim: true },
  bio: { type: String, maxlength: 1000 },
  category: { type: String, enum: ['SINGING', 'DANCING', 'COMEDY', 'SPOKEN_WORD', 'RAP', 'INSTRUMENTAL', 'OTHER'], required: true },
  country: { type: String, required: true },
  state: { type: String },
  age: { type: Number, min: 16, max: 100 },
  gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
  youtubeVideoUrl: { type: String },
  videoFileUrl: { type: String }, // For future file upload
  profileImageUrl: { type: String },
  socialLinks: {
    instagram: { type: String },
    twitter: { type: String },
    tiktok: { type: String },
    facebook: { type: String },
  },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'FROZEN'], default: 'PENDING' },
  rejectionReason: { type: String },
  approvedAt: { type: Date },
  approvedBy: { type: String },
  isFeatured: { type: Boolean, default: false },
  totalVotes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false, timestamps: true });

ContestantProfileSchema.index({ userId: 1 }, { unique: true });
ContestantProfileSchema.index({ status: 1 });
ContestantProfileSchema.index({ category: 1 });
ContestantProfileSchema.index({ country: 1 });
ContestantProfileSchema.index({ totalVotes: -1 });
ContestantProfileSchema.index({ isFeatured: 1 });

export default mongoose.models.ContestantProfile || mongoose.model('ContestantProfile', ContestantProfileSchema);
