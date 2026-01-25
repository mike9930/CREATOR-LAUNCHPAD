import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Round from '@/lib/models/Round';
import AuditLog from '@/lib/models/AuditLog';

// GET /api/rounds/[id]
export async function GET(request, { params }) {
  try {
    const { id } = params;
    await connectDB();

    const round = await Round.findById(id).lean();
    if (!round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ round });
  } catch (error) {
    console.error('Get round error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch round' },
      { status: 500 }
    );
  }
}

// PUT /api/rounds/[id] - Update round (admin only)
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;
    await connectDB();

    const round = await Round.findById(id);
    if (!round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, maxContestants, startDate, endDate, status } = body;

    // If activating round, check no other active round exists
    if (status === 'ACTIVE' && round.status !== 'ACTIVE') {
      const existingActive = await Round.findOne({ status: 'ACTIVE', _id: { $ne: id } });
      if (existingActive) {
        return NextResponse.json(
          { error: 'Another round is already active. Please close it first.' },
          { status: 409 }
        );
      }
    }

    // Update fields
    if (name) round.name = name;
    if (description !== undefined) round.description = description;
    if (maxContestants) round.maxContestants = maxContestants;
    if (startDate) round.startDate = new Date(startDate);
    if (endDate) round.endDate = new Date(endDate);
    if (status) round.status = status;

    await round.save();

    // Audit log
    await AuditLog.create({
      userId: session.user.id,
      action: status === 'ACTIVE' ? 'ACTIVATE_ROUND' : status === 'CLOSED' ? 'CLOSE_ROUND' : 'UPDATE_ROUND',
      targetType: 'ROUND',
      targetId: round._id,
      details: { status, name: round.name },
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      round,
    });
  } catch (error) {
    console.error('Update round error:', error);
    return NextResponse.json(
      { error: 'Failed to update round' },
      { status: 500 }
    );
  }
}

// DELETE /api/rounds/[id] - Delete round (admin only, only DRAFT rounds)
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;
    await connectDB();

    const round = await Round.findById(id);
    if (!round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    if (round.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft rounds can be deleted' },
        { status: 400 }
      );
    }

    await Round.findByIdAndDelete(id);

    // Audit log
    await AuditLog.create({
      userId: session.user.id,
      action: 'DELETE_ROUND',
      targetType: 'ROUND',
      targetId: id,
      details: { name: round.name, roundNumber: round.roundNumber },
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: 'Round deleted',
    });
  } catch (error) {
    console.error('Delete round error:', error);
    return NextResponse.json(
      { error: 'Failed to delete round' },
      { status: 500 }
    );
  }
}
