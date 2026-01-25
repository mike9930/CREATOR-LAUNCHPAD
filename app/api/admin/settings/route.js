import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Settings from '@/lib/models/Settings';
import AuditLog from '@/lib/models/AuditLog';
import { getSetting } from '@/lib/helpers';

// GET /api/admin/settings - Get all settings
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

    const settings = await Settings.find().lean();
    const defaults = Settings.getDefaults();

    // Merge with defaults
    const settingsMap = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
    const mergedSettings = { ...defaults, ...settingsMap };

    return NextResponse.json({ settings: mergedSettings });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update settings
export async function PUT(request) {
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
    const updates = [];

    for (const [key, value] of Object.entries(body)) {
      const result = await Settings.findOneAndUpdate(
        { key },
        { $set: { key, value, updatedBy: session.user.id, updatedAt: new Date() } },
        { upsert: true, new: true }
      );
      updates.push(result);
    }

    // Audit log
    await AuditLog.create({
      userId: session.user.id,
      action: 'UPDATE_SETTINGS',
      targetType: 'SETTINGS',
      details: { updatedKeys: Object.keys(body) },
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      updates,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
