import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import ContestantProfile from '@/lib/models/ContestantProfile';
import User from '@/lib/models/User';
import AuditLog from '@/lib/models/AuditLog';

// PUT /api/admin/contestants/[id] - Update contestant (approve/reject/freeze)
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

    const contestant = await ContestantProfile.findById(id);
    if (!contestant) {
      return NextResponse.json(
        { error: 'Contestant not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, rejectionReason, isFeatured } = body;
    const oldStatus = contestant.status;

    // Update fields
    if (status) {
      contestant.status = status;
      if (status === 'APPROVED') {
        contestant.approvedAt = new Date();
        contestant.approvedBy = session.user.id;
      } else if (status === 'REJECTED') {
        contestant.rejectionReason = rejectionReason;
      }
    }
    if (isFeatured !== undefined) {
      contestant.isFeatured = isFeatured;
    }

    await contestant.save();

    // Audit log
    await AuditLog.create({
      userId: session.user.id,
      action: status ? `${status}_CONTESTANT` : 'UPDATE_CONTESTANT',
      targetType: 'CONTESTANT',
      targetId: id,
      details: { oldStatus, newStatus: status, rejectionReason, isFeatured },
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      contestant,
    });
  } catch (error) {
    console.error('Admin update contestant error:', error);
    return NextResponse.json(
      { error: 'Failed to update contestant' },
      { status: 500 }
    );
  }
}
