import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const RoundSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  name: { type: String, required: true }, // e.g., 'Top 50', 'Top 25', 'Top 10', 'Top 5 Final'
  description: { type: String },
  roundNumber: { type: Number, required: true }, // 1, 2, 3, 4
  maxContestants: { type: Number }, // 50, 25, 10, 5
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED'], default: 'DRAFT' },
  resultsPublished: { type: Boolean, default: false },
  resultsPublishedAt: { type: Date },
  createdBy: { type: String, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false, timestamps: true });

RoundSchema.index({ status: 1 });
RoundSchema.index({ roundNumber: 1 });
RoundSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.models.Round || mongoose.model('Round', RoundSchema);
