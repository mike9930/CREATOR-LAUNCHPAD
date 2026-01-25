'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/Navbar';
import { Users, Search, CheckCircle, XCircle, Star, Ban, Eye, Loader2, LayoutDashboard, Trophy, CreditCard, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminContestantsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [contestants, setContestants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [selectedContestant, setSelectedContestant] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, action: '', reason: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/admin/contestants');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/');
    } else {
      fetchContestants();
    }
  }, [session, status, statusFilter, search, page]);

  const fetchContestants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/contestants?${params}`);
      if (res.ok) {
        const data = await res.json();
        setContestants(data.contestants || []);
        setPagination(data.pagination || { total: 0, totalPages: 1 });
      }
    } catch (error) {
      console.error('Failed to fetch contestants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedContestant || !actionDialog.action) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/contestants/${selectedContestant._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionDialog.action === 'approve' ? 'APPROVED' : 
                  actionDialog.action === 'reject' ? 'REJECTED' : 
                  actionDialog.action === 'freeze' ? 'FROZEN' : selectedContestant.status,
          rejectionReason: actionDialog.reason,
          isFeatured: actionDialog.action === 'feature' ? true : 
                      actionDialog.action === 'unfeature' ? false : selectedContestant.isFeatured,
        }),
      });

      if (res.ok) {
        toast.success(`Contestant ${actionDialog.action}d successfully`);
        fetchContestants();
        setActionDialog({ open: false, action: '', reason: '' });
        setSelectedContestant(null);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Action failed');
      }
    } catch (error) {
      toast.error('Action failed');
    } finally {
      setActionLoading(false);
    }
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
                  item.href === '/admin/contestants' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </div>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-6">Manage Contestants</h1>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or country..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="FROZEN">Frozen</SelectItem>
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
                      <TableHead>Contestant</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Votes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contestants.map((c) => (
                      <TableRow key={c._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{c.stageName}</p>
                            <p className="text-sm text-gray-500">{c.user?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{c.category}</TableCell>
                        <TableCell>{c.country}</TableCell>
                        <TableCell>{c.totalVotes.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={
                            c.status === 'APPROVED' ? 'default' :
                            c.status === 'PENDING' ? 'secondary' :
                            c.status === 'REJECTED' ? 'destructive' : 'outline'
                          }>
                            {c.status}
                          </Badge>
                          {c.isFeatured && <Badge className="ml-1 bg-yellow-500"><Star className="w-3 h-3" /></Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Link href={`/contestants/${c._id}`} target="_blank">
                              <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                            </Link>
                            {c.status === 'PENDING' && (
                              <>
                                <Button variant="ghost" size="sm" className="text-green-600" onClick={() => { setSelectedContestant(c); setActionDialog({ open: true, action: 'approve', reason: '' }); }}>
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => { setSelectedContestant(c); setActionDialog({ open: true, action: 'reject', reason: '' }); }}>
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {c.status === 'APPROVED' && (
                              <>
                                <Button variant="ghost" size="sm" className="text-yellow-600" onClick={() => { setSelectedContestant(c); setActionDialog({ open: true, action: c.isFeatured ? 'unfeature' : 'feature', reason: '' }); }}>
                                  <Star className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => { setSelectedContestant(c); setActionDialog({ open: true, action: 'freeze', reason: '' }); }}>
                                  <Ban className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {!loading && contestants.length === 0 && (
                <div className="text-center py-20 text-gray-500">No contestants found</div>
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

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'approve' && 'Approve Contestant'}
              {actionDialog.action === 'reject' && 'Reject Contestant'}
              {actionDialog.action === 'freeze' && 'Freeze Contestant'}
              {actionDialog.action === 'feature' && 'Feature Contestant'}
              {actionDialog.action === 'unfeature' && 'Remove from Featured'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedContestant && (
              <p className="mb-4">Contestant: <strong>{selectedContestant.stageName}</strong></p>
            )}
            {(actionDialog.action === 'reject' || actionDialog.action === 'freeze') && (
              <Textarea
                placeholder="Reason (optional)"
                value={actionDialog.reason}
                onChange={(e) => setActionDialog({ ...actionDialog, reason: e.target.value })}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, action: '', reason: '' })}>Cancel</Button>
            <Button onClick={handleAction} disabled={actionLoading} className={
              actionDialog.action === 'approve' || actionDialog.action === 'feature' ? 'bg-green-600' :
              actionDialog.action === 'reject' || actionDialog.action === 'freeze' ? 'bg-red-600' : ''
            }>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
