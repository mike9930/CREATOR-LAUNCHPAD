import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import ContestantProfile from '@/lib/models/ContestantProfile';
import User from '@/lib/models/User';
import Transaction from '@/lib/models/Transaction';
import Round from '@/lib/models/Round';
import { parseYouTubeUrl, getYouTubeEmbedUrl, getYouTubeThumbnail } from '@/lib/helpers';

// GET /api/contestants/[id] - Get contestant details
export async function GET(request, { params }) {
  try {
    const { id } = params;
    await connectDB();

    const contestant = await ContestantProfile.findById(id).lean();
    if (!contestant) {
      return NextResponse.json(
        { error: 'Contestant not found' },
        { status: 404 }
      );
    }

    // Get user info
    const user = await User.findById(contestant.userId).select('name email').lean();

    // Get YouTube embed info
    let videoEmbed = null;
    let videoThumbnail = null;
    if (contestant.youtubeVideoUrl) {
      const videoId = parseYouTubeUrl(contestant.youtubeVideoUrl);
      if (videoId) {
        videoEmbed = getYouTubeEmbedUrl(videoId);
        videoThumbnail = getYouTubeThumbnail(videoId);
      }
    }

    // Get vote stats per round
    const votesByRound = await Transaction.aggregate([
      { $match: { contestantId: id, status: 'SUCCESS' } },
      { $group: { _id: '$roundId', totalVotes: { $sum: '$votesPurchased' } } },
    ]);

    // Get active round
    const activeRound = await Round.findOne({ status: 'ACTIVE' }).lean();

    return NextResponse.json({
      contestant: {
        ...contestant,
        user,
        videoEmbed,
        videoThumbnail,
        votesByRound,
      },
      activeRound,
    });
  } catch (error) {
    console.error('Get contestant error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contestant' },
      { status: 500 }
    );
  }
}

// PUT /api/contestants/[id] - Update contestant profile
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;
    await connectDB();

    const contestant = await ContestantProfile.findById(id);
    if (!contestant) {
      return NextResponse.json(
        { error: 'Contestant not found' },
        { status: 404 }
      );
    }

    // Check ownership or admin
    const isOwner = contestant.userId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to update this profile' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const allowedFields = ['stageName', 'bio', 'category', 'country', 'state', 'age', 'gender', 'youtubeVideoUrl', 'profileImageUrl', 'socialLinks'];
    
    // Admin-only fields
    const adminFields = ['status', 'isFeatured', 'rejectionReason'];
    if (isAdmin) {
      allowedFields.push(...adminFields);
    }

    // Update only allowed fields
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        contestant[field] = body[field];
      }
    }

    // If status changed to APPROVED by admin
    if (isAdmin && body.status === 'APPROVED' && contestant.status !== 'APPROVED') {
      contestant.approvedAt = new Date();
      contestant.approvedBy = session.user.id;
    }

    await contestant.save();

    return NextResponse.json({
      success: true,
      contestant,
    });
  } catch (error) {
    console.error('Update contestant error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
