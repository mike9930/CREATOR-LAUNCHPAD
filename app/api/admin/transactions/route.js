import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Transaction from '@/lib/models/Transaction';
import ContestantProfile from '@/lib/models/ContestantProfile';
import User from '@/lib/models/User';
import AuditLog from '@/lib/models/AuditLog';

// GET /api/admin/transactions - List all transactions
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
    const flagged = searchParams.get('flagged');
    const exportCsv = searchParams.get('export') === 'csv';

    const skip = (page - 1) * limit;
    const query = {};

    if (status) query.status = status;
    if (flagged === 'true') query.isFlagged = true;

    // For CSV export, get all matching records
    const fetchLimit = exportCsv ? 10000 : limit;
    const fetchSkip = exportCsv ? 0 : skip;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(fetchSkip)
        .limit(fetchLimit)
        .lean(),
      Transaction.countDocuments(query),
    ]);

    // Get user and contestant info
    const userIds = [...new Set(transactions.map(t => t.userId))];
    const contestantIds = [...new Set(transactions.map(t => t.contestantId))];

    const [users, contestants] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select('name email').lean(),
      ContestantProfile.find({ _id: { $in: contestantIds } }).select('stageName').lean(),
    ]);

    const userMap = users.reduce((acc, u) => ({ ...acc, [u._id]: u }), {});
    const contestantMap = contestants.reduce((acc, c) => ({ ...acc, [c._id]: c }), {});

    const enrichedTransactions = transactions.map(t => ({
      ...t,
      user: userMap[t.userId],
      contestant: contestantMap[t.contestantId],
    }));

    // Export CSV
    if (exportCsv) {
      const csvHeaders = 'Reference,User Email,User Name,Contestant,Votes,Amount (Kobo),Status,Created At\n';
      const csvRows = enrichedTransactions.map(t => 
        `${t.reference},${t.user?.email || ''},${t.user?.name || ''},${t.contestant?.stageName || ''},${t.votesPurchased},${t.amountPaid},${t.status},${t.createdAt}`
      ).join('\n');
      const csv = csvHeaders + csvRows;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      transactions: enrichedTransactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/transactions - Flag/unflag transaction
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
    const { transactionId, action, reason } = body;

    if (!transactionId || !action) {
      return NextResponse.json(
        { error: 'Transaction ID and action are required' },
        { status: 400 }
      );
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'flag':
        transaction.isFlagged = true;
        transaction.flagReason = reason;
        transaction.flaggedAt = new Date();
        transaction.flaggedBy = session.user.id;
        break;
      case 'unflag':
        transaction.isFlagged = false;
        transaction.flagReason = null;
        transaction.flaggedAt = null;
        transaction.flaggedBy = null;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await transaction.save();

    // Audit log
    await AuditLog.create({
      userId: session.user.id,
      action: `${action.toUpperCase()}_TRANSACTION`,
      targetType: 'TRANSACTION',
      targetId: transactionId,
      details: { reason, reference: transaction.reference },
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error('Admin transaction action error:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}
