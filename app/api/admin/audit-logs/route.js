import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import AuditLog from '@/lib/models/AuditLog';
import User from '@/lib/models/User';

// GET /api/admin/audit-logs - Get audit logs
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
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');

    const skip = (page - 1) * limit;
    const query = {};

    if (action) query.action = action;
    if (userId) query.userId = userId;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    // Get admin user names
    const adminIds = [...new Set(logs.map(l => l.userId))];
    const admins = await User.find({ _id: { $in: adminIds } }).select('name email').lean();
    const adminMap = admins.reduce((acc, a) => ({ ...acc, [a._id]: a }), {});

    const enrichedLogs = logs.map(l => ({
      ...l,
      admin: adminMap[l.userId],
    }));

    return NextResponse.json({
      logs: enrichedLogs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
