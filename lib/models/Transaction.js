import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const TransactionSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  userId: { type: String, required: true, ref: 'User' },
  contestantId: { type: String, required: true, ref: 'ContestantProfile' },
  roundId: { type: String, required: true, ref: 'Round' },
  
  // PayPal order details
  paypalOrderId: { type: String, unique: true, sparse: true },
  reference: { type: String, required: true, unique: true }, // Internal reference
  
  // Vote details
  votesQty: { type: Number, required: true, min: 1 },
  pricePerVote: { type: Number, required: true }, // In cents/smallest unit at time of purchase
  
  // Payment details
  amount: { type: Number, required: true }, // Total amount in dollars/main unit
  currency: { type: String, default: 'USD' },
  
  // Status tracking
  status: { type: String, enum: ['PENDING', 'APPROVED', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'], default: 'PENDING' },
  
  // PayPal response data
  paypalResponse: { type: mongoose.Schema.Types.Mixed },
  captureId: { type: String },
  
  // Timestamps
  verifiedAt: { type: Date },
  webhookReceivedAt: { type: Date },
  
  // Anti-fraud
  userIp: { type: String },
  userAgent: { type: String },
  isFlagged: { type: Boolean, default: false },
  flagReason: { type: String },
  flaggedAt: { type: Date },
  flaggedBy: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false, timestamps: true });

TransactionSchema.index({ paypalOrderId: 1 }, { unique: true, sparse: true });
TransactionSchema.index({ reference: 1 }, { unique: true });
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ contestantId: 1 });
TransactionSchema.index({ roundId: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdAt: -1 });

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
