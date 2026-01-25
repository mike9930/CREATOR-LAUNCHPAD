import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const TransactionSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  userId: { type: String, required: true, ref: 'User' },
  contestantId: { type: String, required: true, ref: 'ContestantProfile' },
  roundId: { type: String, required: true, ref: 'Round' },
  reference: { type: String, required: true, unique: true }, // Paystack reference
  votesPurchased: { type: Number, required: true, min: 1 },
  amountPaid: { type: Number, required: true }, // In kobo (smallest unit)
  currency: { type: String, default: 'NGN' },
  pricePerVote: { type: Number, required: true }, // In kobo at time of purchase
  status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'], default: 'PENDING' },
  paystackResponse: { type: mongoose.Schema.Types.Mixed },
  verifiedAt: { type: Date },
  webhookReceivedAt: { type: Date },
  userIp: { type: String },
  userAgent: { type: String },
  isFlagged: { type: Boolean, default: false },
  flagReason: { type: String },
  flaggedAt: { type: Date },
  flaggedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false, timestamps: true });

TransactionSchema.index({ reference: 1 }, { unique: true });
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ contestantId: 1 });
TransactionSchema.index({ roundId: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdAt: -1 });

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
