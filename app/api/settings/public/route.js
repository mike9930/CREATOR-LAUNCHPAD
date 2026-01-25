import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSetting } from '@/lib/helpers';
import Round from '@/lib/models/Round';

// GET /api/settings/public - Get public settings
export async function GET() {
  try {
    await connectDB();

    const [votePrice, currency, prizePool, siteName, siteDescription, socialLinks, supportEmail] = await Promise.all([
      getSetting('votePrice', 5000),
      getSetting('currency', 'NGN'),
      getSetting('prizePool', { first: 500000, second: 200000, third: 150000, fourth: 100000, fifth: 50000 }),
      getSetting('siteName', 'Africa One Voice'),
      getSetting('siteDescription', 'Pan-African Digital Talent Show'),
      getSetting('socialLinks', { facebook: '', twitter: '', instagram: '', tiktok: '' }),
      getSetting('supportEmail', 'support@africaonevoice.com'),
    ]);

    const activeRound = await Round.findOne({ status: 'ACTIVE' }).lean();

    return NextResponse.json({
      votePrice,
      votePriceFormatted: `₦${(votePrice / 100).toLocaleString()}`,
      currency,
      prizePool,
      siteName,
      siteDescription,
      socialLinks,
      supportEmail,
      activeRound,
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
