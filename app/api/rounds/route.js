import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Round from '@/lib/models/Round';
import AuditLog from '@/lib/models/AuditLog';

// GET /api/rounds - List all rounds (public: only active, admin: all)
export async function GET(request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'ADMIN';

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let query = {};
    if (activeOnly || !isAdmin) {
      query.status = { $in: ['ACTIVE', 'CLOSED'] };
    }

    const rounds = await Round.find(query)
      .sort({ roundNumber: 1 })
      .lean();

    // Get current active round
    const activeRound = await Round.findOne({ status: 'ACTIVE' }).lean();

    return NextResponse.json({
      rounds,
      activeRound,
    });
  } catch (error) {
    console.error('Get rounds error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rounds' },
      { status: 500 }
    );
  }
}

// POST /api/rounds - Create new round (admin only)
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
    const { name, description, roundNumber, maxContestants, startDate, endDate } = body;

    // Validation
    if (!name || !roundNumber || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Name, round number, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Check for duplicate round number
    const existingRound = await Round.findOne({ roundNumber });
    if (existingRound) {
      return NextResponse.json(
        { error: 'A round with this number already exists' },
        { status: 409 }
      );
    }

    const round = await Round.create({
      name,
      description,
      roundNumber,
      maxContestants,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'DRAFT',
      createdBy: session.user.id,
    });

    // Audit log
    await AuditLog.create({
      userId: session.user.id,
      action: 'CREATE_ROUND',
      targetType: 'ROUND',
      targetId: round._id,
      details: { name, roundNumber },
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      round,
    }, { status: 201 });
  } catch (error) {
    console.error('Create round error:', error);
    return NextResponse.json(
      { error: 'Failed to create round' },
      { status: 500 }
    );
  }
}
