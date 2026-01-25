import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import ContestantProfile from '@/lib/models/ContestantProfile';
import User from '@/lib/models/User';
import AuditLog from '@/lib/models/AuditLog';

// GET /api/admin/contestants - List all contestants with filters
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { stageName: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
      ];
    }

    const [contestants, total] = await Promise.all([
      ContestantProfile.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ContestantProfile.countDocuments(query),
    ]);

    // Get user info
    const userIds = contestants.map(c => c.userId);
    const users = await User.find({ _id: { $in: userIds } }).select('name email phone').lean();
    const userMap = users.reduce((acc, u) => ({ ...acc, [u._id]: u }), {});

    const enrichedContestants = contestants.map(c => ({
      ...c,
      user: userMap[c.userId],
    }));

    return NextResponse.json({
      contestants: enrichedContestants,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin contestants error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contestants' },
      { status: 500 }
    );
  }
}

// POST /api/admin/contestants - Bulk action
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { action, contestantIds, reason } = body;

    if (!action || !contestantIds || !Array.isArray(contestantIds)) {
      return NextResponse.json(
        { error: 'Action and contestant IDs are required' },
        { status: 400 }
      );
    }

    let updateData = {};
    switch (action) {
      case 'approve':
        updateData = { status: 'APPROVED', approvedAt: new Date(), approvedBy: session.user.id };
        break;
      case 'reject':
        updateData = { status: 'REJECTED', rejectionReason: reason };
        break;
      case 'freeze':
        updateData = { status: 'FROZEN' };
        break;
      case 'feature':
        updateData = { isFeatured: true };
        break;
      case 'unfeature':
        updateData = { isFeatured: false };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await ContestantProfile.updateMany(
      { _id: { $in: contestantIds } },
      { $set: updateData }
    );

    // Audit log
    await AuditLog.create({
      userId: session.user.id,
      action: `BULK_${action.toUpperCase()}_CONTESTANTS`,
      targetType: 'CONTESTANT',
      details: { contestantIds, reason },
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Admin bulk action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}
