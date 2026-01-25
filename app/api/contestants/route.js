import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import ContestantProfile from '@/lib/models/ContestantProfile';
import User from '@/lib/models/User';
import Round from '@/lib/models/Round';
import Transaction from '@/lib/models/Transaction';
import { parseYouTubeUrl } from '@/lib/helpers';

// GET /api/contestants - List all approved contestants (public) or filter
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const category = searchParams.get('category');
    const country = searchParams.get('country');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const status = searchParams.get('status'); // For admin

    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    // Check if admin requesting all statuses
    const session = await getServerSession(authOptions);
    if (session?.user?.role === 'ADMIN' && status) {
      query.status = status;
    } else {
      query.status = 'APPROVED';
    }

    if (category) query.category = category;
    if (country) query.country = country;
    if (featured === 'true') query.isFeatured = true;
    if (search) {
      query.$or = [
        { stageName: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
      ];
    }

    const [contestants, total] = await Promise.all([
      ContestantProfile.find(query)
        .sort({ totalVotes: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ContestantProfile.countDocuments(query),
    ]);

    // Get user info for each contestant
    const userIds = contestants.map(c => c.userId);
    const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();
    const userMap = users.reduce((acc, u) => ({ ...acc, [u._id]: u }), {});

    const enrichedContestants = contestants.map(c => ({
      ...c,
      user: userMap[c.userId] || null,
    }));

    return NextResponse.json({
      contestants: enrichedContestants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get contestants error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contestants' },
      { status: 500 }
    );
  }
}

// POST /api/contestants - Create contestant profile (requires auth)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    // Check if already has a profile
    const existingProfile = await ContestantProfile.findOne({ userId: session.user.id });
    if (existingProfile) {
      return NextResponse.json(
        { error: 'You already have a contestant profile' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const { stageName, bio, category, country, state, age, gender, youtubeVideoUrl, profileImageUrl, socialLinks } = body;

    // Validation
    if (!stageName || !category || !country) {
      return NextResponse.json(
        { error: 'Stage name, category, and country are required' },
        { status: 400 }
      );
    }

    // Validate YouTube URL if provided
    if (youtubeVideoUrl) {
      const videoId = parseYouTubeUrl(youtubeVideoUrl);
      if (!videoId) {
        return NextResponse.json(
          { error: 'Invalid YouTube URL' },
          { status: 400 }
        );
      }
    }

    // Create profile
    const profile = await ContestantProfile.create({
      userId: session.user.id,
      stageName,
      bio,
      category,
      country,
      state,
      age,
      gender,
      youtubeVideoUrl,
      profileImageUrl,
      socialLinks,
      status: 'PENDING',
    });

    // Update user role to CONTESTANT
    await User.findByIdAndUpdate(session.user.id, { role: 'CONTESTANT' });

    return NextResponse.json({
      success: true,
      message: 'Profile submitted for review',
      profile,
    }, { status: 201 });
  } catch (error) {
    console.error('Create contestant error:', error);
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}
