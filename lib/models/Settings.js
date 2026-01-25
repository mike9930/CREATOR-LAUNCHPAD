import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const SettingsSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  description: { type: String },
  updatedBy: { type: String, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false, timestamps: true });

SettingsSchema.index({ key: 1 }, { unique: true });

// Default settings helper
SettingsSchema.statics.getDefaults = function() {
  return {
    votePrice: 5000, // 50 NGN in kobo
    currency: 'NGN',
    minVotesPerPurchase: 1,
    maxVotesPerPurchase: 1000,
    supportEmail: 'support@africaonevoice.com',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      tiktok: '',
    },
    prizePool: {
      first: 500000,
      second: 200000,
      third: 150000,
      fourth: 100000,
      fifth: 50000,
    },
    siteName: 'Africa One Voice',
    siteDescription: 'Pan-African Digital Talent Show',
  };
};

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
