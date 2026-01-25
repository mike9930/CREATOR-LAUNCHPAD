'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';
import { Trophy, Plus, Play, Square, Edit, Trash2, Loader2, LayoutDashboard, Users, CreditCard, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminRoundsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRound, setEditingRound] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    roundNumber: 1,
    maxContestants: 50,
    startDate: '',
    endDate: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/admin/rounds');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/');
    } else {
      fetchRounds();
    }
  }, [session, status]);

  const fetchRounds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rounds');
      if (res.ok) {
        const data = await res.json();
        setRounds(data.rounds || []);
      }
    } catch (error) {
      console.error('Failed to fetch rounds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      const url = editingRound ? `/api/rounds/${editingRound._id}` : '/api/rounds';
      const method = editingRound ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingRound ? 'Round updated' : 'Round created');
        fetchRounds();
        closeDialog();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save round');
      }
    } catch (error) {
      toast.error('Failed to save round');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (round, newStatus) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/rounds/${round._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Round ${newStatus.toLowerCase()}`);
        fetchRounds();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update round');
      }
    } catch (error) {
      toast.error('Failed to update round');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (round) => {
    if (!confirm('Delete this round? This cannot be undone.')) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/rounds/${round._id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Round deleted');
        fetchRounds();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete round');
      }
    } catch (error) {
      toast.error('Failed to delete round');
    } finally {
      setActionLoading(false);
    }
  };

  const openDialog = (round = null) => {
    if (round) {
      setEditingRound(round);
      setFormData({
        name: round.name,
        description: round.description || '',
        roundNumber: round.roundNumber,
        maxContestants: round.maxContestants || 50,
        startDate: round.startDate ? format(new Date(round.startDate), "yyyy-MM-dd'T'HH:mm") : '',
        endDate: round.endDate ? format(new Date(round.endDate), "yyyy-MM-dd'T'HH:mm") : '',
      });
    } else {
      setEditingRound(null);
      setFormData({
        name: '',
        description: '',
        roundNumber: rounds.length + 1,
        maxContestants: 50,
        startDate: '',
        endDate: '',
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRound(null);
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
                  item.href === '/admin/rounds' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
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
            <h1 className="text-2xl font-bold">Voting Rounds</h1>
            <Button onClick={() => openDialog()} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" /> Create Round
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : rounds.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {rounds.map((round) => (
                <Card key={round._id} className={round.status === 'ACTIVE' ? 'border-green-500 border-2' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        {round.name}
                      </CardTitle>
                      <Badge variant={
                        round.status === 'ACTIVE' ? 'default' :
                        round.status === 'CLOSED' ? 'secondary' :
                        round.status === 'DRAFT' ? 'outline' : 'destructive'
                      }>
                        {round.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <p>Round #{round.roundNumber} • Max: {round.maxContestants} contestants</p>
                      <p>Start: {format(new Date(round.startDate), 'PPp')}</p>
                      <p>End: {format(new Date(round.endDate), 'PPp')}</p>
                      {round.description && <p className="text-gray-500">{round.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      {round.status === 'DRAFT' && (
                        <>
                          <Button size="sm" onClick={() => handleStatusChange(round, 'ACTIVE')} className="bg-green-600">
                            <Play className="w-4 h-4 mr-1" /> Activate
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openDialog(round)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(round)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {round.status === 'ACTIVE' && (
                        <Button size="sm" variant="destructive" onClick={() => handleStatusChange(round, 'CLOSED')}>
                          <Square className="w-4 h-4 mr-1" /> Close Round
                        </Button>
                      )}
                      {round.status === 'CLOSED' && (
                        <Badge variant="secondary">Voting Ended</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-20 text-center">
                <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No rounds created yet</h3>
                <p className="text-gray-500 mb-4">Create your first voting round to start the competition!</p>
                <Button onClick={() => openDialog()} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" /> Create Round
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRound ? 'Edit Round' : 'Create New Round'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Round Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Top 50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Round Number</Label>
                <Input type="number" min={1} value={formData.roundNumber} onChange={(e) => setFormData({ ...formData, roundNumber: parseInt(e.target.value) })} />
              </div>
              <div>
                <Label>Max Contestants</Label>
                <Input type="number" min={1} value={formData.maxContestants} onChange={(e) => setFormData({ ...formData, maxContestants: parseInt(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Start Date & Time</Label>
              <Input type="datetime-local" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
            <div>
              <Label>End Date & Time</Label>
              <Input type="datetime-local" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={actionLoading || !formData.name || !formData.startDate || !formData.endDate} className="bg-green-600">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingRound ? 'Save Changes' : 'Create Round')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
