/**
 * Database Seed Script for Africa One Voice (AOV)
 * Run: node scripts/seed.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'aov_database';

// Define schemas inline for the seed script
const UserSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String },
  phoneVerified: { type: Boolean, default: true },
  role: { type: String, enum: ['VOTER', 'CONTESTANT', 'ADMIN'], default: 'VOTER' },
  country: { type: String },
  isActive: { type: Boolean, default: true },
  isFrozen: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const ContestantProfileSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  userId: { type: String, required: true },
  stageName: { type: String, required: true },
  bio: { type: String },
  category: { type: String, required: true },
  country: { type: String, required: true },
  state: { type: String },
  age: { type: Number },
  gender: { type: String },
  youtubeVideoUrl: { type: String },
  profileImageUrl: { type: String },
  status: { type: String, default: 'APPROVED' },
  isFeatured: { type: Boolean, default: false },
  totalVotes: { type: Number, default: 0 },
  approvedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const RoundSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  name: { type: String, required: true },
  description: { type: String },
  roundNumber: { type: Number, required: true },
  maxContestants: { type: Number },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const SettingsSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const User = mongoose.model('User', UserSchema);
const ContestantProfile = mongoose.model('ContestantProfile', ContestantProfileSchema);
const Round = mongoose.model('Round', RoundSchema);
const Settings = mongoose.model('Settings', SettingsSchema);

const AFRICAN_COUNTRIES = ['Nigeria', 'South Africa', 'Kenya', 'Ghana', 'Egypt', 'Morocco', 'Ethiopia', 'Tanzania', 'Uganda', 'Cameroon'];
const CATEGORIES = ['SINGING', 'DANCING', 'COMEDY', 'SPOKEN_WORD', 'RAP', 'INSTRUMENTAL'];

const DEMO_CONTESTANTS = [
  { name: 'Amara Okonkwo', stage: 'Amara Gold', country: 'Nigeria', category: 'SINGING', bio: 'Soulful vocalist from Lagos with a passion for Afrobeats and R&B fusion.', video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { name: 'Kwame Asante', stage: 'Kwame Flow', country: 'Ghana', category: 'RAP', bio: 'Hip-hop artist bringing the streets of Accra to the world stage.', video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { name: 'Zara Mbeki', stage: 'Zara Dance', country: 'South Africa', category: 'DANCING', bio: 'Contemporary dancer blending traditional African moves with modern styles.', video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { name: 'Ahmed Hassan', stage: 'Ahmed Comedy', country: 'Egypt', category: 'COMEDY', bio: 'Stand-up comedian making audiences laugh across Africa and the Middle East.', video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { name: 'Fatima Diallo', stage: 'Fatima Voice', country: 'Senegal', category: 'SINGING', bio: 'Powerful vocalist with roots in traditional Wolof music.', video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { name: 'David Ochieng', stage: 'Dave Keys', country: 'Kenya', category: 'INSTRUMENTAL', bio: 'Multi-instrumentalist specializing in piano and traditional drums.', video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { name: 'Blessing Eze', stage: 'Bless Spoken', country: 'Nigeria', category: 'SPOKEN_WORD', bio: 'Poet and spoken word artist addressing social issues through powerful verses.', video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { name: 'Yusuf Mohammed', stage: 'Yusuf Beats', country: 'Morocco', category: 'RAP', bio: 'Bilingual rapper mixing Arabic and English in unique ways.', video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { name: 'Grace Wanjiku', stage: 'Grace Moves', country: 'Kenya', category: 'DANCING', bio: 'Award-winning dancer known for energetic performances.', video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { name: 'Emmanuel Adeyemi', stage: 'Emma Vibes', country: 'Nigeria', category: 'SINGING', bio: 'Rising Afrobeats star with millions of streams online.', video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URL, { dbName: DB_NAME });
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await ContestantProfile.deleteMany({});
    await Round.deleteMany({});
    await Settings.deleteMany({});

    // Create admin user
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      email: 'admin@africaonevoice.com',
      password: adminPassword,
      name: 'AOV Admin',
      phone: '+234 800 000 0000',
      role: 'ADMIN',
      country: 'Nigeria',
      phoneVerified: true,
    });
    console.log('Admin created:', admin.email);

    // Create demo voter
    const voterPassword = await bcrypt.hash('voter123', 12);
    await User.create({
      email: 'voter@test.com',
      password: voterPassword,
      name: 'Test Voter',
      phone: '+234 800 111 1111',
      role: 'VOTER',
      country: 'Nigeria',
      phoneVerified: true,
    });
    console.log('Test voter created: voter@test.com');

    // Create contestants
    console.log('Creating contestants...');
    for (let i = 0; i < DEMO_CONTESTANTS.length; i++) {
      const contestant = DEMO_CONTESTANTS[i];
      const password = await bcrypt.hash('contestant123', 12);
      
      const user = await User.create({
        email: `contestant${i + 1}@test.com`,
        password,
        name: contestant.name,
        phone: `+234 800 ${String(i + 1).padStart(3, '0')} ${String(i + 1).padStart(4, '0')}`,
        role: 'CONTESTANT',
        country: contestant.country,
        phoneVerified: true,
      });

      await ContestantProfile.create({
        userId: user._id,
        stageName: contestant.stage,
        bio: contestant.bio,
        category: contestant.category,
        country: contestant.country,
        state: 'Capital City',
        age: 20 + i,
        gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
        youtubeVideoUrl: contestant.video,
        status: 'APPROVED',
        isFeatured: i < 3, // First 3 are featured
        totalVotes: Math.floor(Math.random() * 500) + 50, // Random votes 50-550
        approvedAt: new Date(),
      });

      console.log(`  Created: ${contestant.stage} (${contestant.country})`);
    }

    // Create active round
    console.log('Creating active voting round...');
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 14); // 2 weeks from now

    await Round.create({
      name: 'Top 50 - Round 1',
      description: 'First round of voting. Top 25 contestants will advance to the next round.',
      roundNumber: 1,
      maxContestants: 50,
      startDate: now,
      endDate: endDate,
      status: 'ACTIVE',
    });
    console.log('Active round created: Top 50 - Round 1');

    // Create settings
    console.log('Creating default settings...');
    const defaultSettings = [
      { key: 'votePrice', value: 5000 }, // 50 NGN in kobo
      { key: 'currency', value: 'NGN' },
      { key: 'minVotesPerPurchase', value: 1 },
      { key: 'maxVotesPerPurchase', value: 1000 },
      { key: 'supportEmail', value: 'support@africaonevoice.com' },
      { key: 'siteName', value: 'Africa One Voice' },
      { key: 'siteDescription', value: 'Pan-African Digital Talent Show' },
      { key: 'prizePool', value: { first: 500000, second: 200000, third: 150000, fourth: 100000, fifth: 50000 } },
      { key: 'socialLinks', value: { facebook: '', twitter: '', instagram: '', tiktok: '' } },
    ];

    for (const setting of defaultSettings) {
      await Settings.create(setting);
    }
    console.log('Settings created');

    console.log('\n========================================');
    console.log('SEED COMPLETE!');
    console.log('========================================');
    console.log('\nDemo Accounts:');
    console.log('  Admin: admin@africaonevoice.com / admin123');
    console.log('  Voter: voter@test.com / voter123');
    console.log('  Contestants: contestant1@test.com to contestant10@test.com / contestant123');
    console.log('\nVote Price: ₦50 per vote');
    console.log('Active Round: Top 50 - Round 1');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
