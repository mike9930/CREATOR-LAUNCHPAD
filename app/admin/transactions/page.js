'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Navbar from '@/components/Navbar';
import { CreditCard, Download, Flag, Loader2, LayoutDashboard, Users, Trophy, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function AdminTransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [flaggedFilter, setFlaggedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/admin/transactions');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/');
    } else {
      fetchTransactions();
    }
  }, [session, status, statusFilter, flaggedFilter, page]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (flaggedFilter) params.set('flagged', flaggedFilter);

      const res = await fetch(`/api/admin/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setPagination(data.pagination || { total: 0, totalPages: 1 });
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlag = async (tx, shouldFlag) => {
    try {
      const res = await fetch('/api/admin/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: tx._id,
          action: shouldFlag ? 'flag' : 'unflag',
          reason: shouldFlag ? 'Manual review' : '',
        }),
      });

      if (res.ok) {
        toast.success(shouldFlag ? 'Transaction flagged' : 'Flag removed');
        fetchTransactions();
      }
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams({ export: 'csv' });
    if (statusFilter) params.set('status', statusFilter);
    if (flaggedFilter) params.set('flagged', flaggedFilter);
    window.open(`/api/admin/transactions?${params}`, '_blank');
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/contestants', label: 'Contestants', icon: Users },
    { href: '/admin/rounds', label: 'Rounds', icon: Trophy },
    { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex">
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-64px)] hidden md:block">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  item.href === '/admin/transactions' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </div>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Transactions</h1>
            <Button onClick={handleExport} variant="outline">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={flaggedFilter} onValueChange={(v) => { setFlaggedFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Transactions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Transactions</SelectItem>
                    <SelectItem value="true">Flagged Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Contestant</TableHead>
                      <TableHead>Votes</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx._id} className={tx.isFlagged ? 'bg-red-50' : ''}>
                        <TableCell className="font-mono text-sm">{tx.reference}</TableCell>
                        <TableCell>{tx.user?.email || 'N/A'}</TableCell>
                        <TableCell>{tx.contestant?.stageName || 'N/A'}</TableCell>
                        <TableCell>{tx.votesPurchased}</TableCell>
                        <TableCell>₦{(tx.amountPaid / 100).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={
                            tx.status === 'SUCCESS' ? 'default' :
                            tx.status === 'PENDING' ? 'secondary' : 'destructive'
                          }>
                            {tx.status}
                          </Badge>
                          {tx.isFlagged && <Badge variant="destructive" className="ml-1"><Flag className="w-3 h-3" /></Badge>}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFlag(tx, !tx.isFlagged)}
                            className={tx.isFlagged ? 'text-green-600' : 'text-red-600'}
                          >
                            <Flag className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {!loading && transactions.length === 0 && (
                <div className="text-center py-20 text-gray-500">No transactions found</div>
              )}

              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 p-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                  <span className="flex items-center px-4">Page {page} of {pagination.totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}>Next</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
