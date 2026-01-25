'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  LayoutDashboard, Users, Trophy, CreditCard, Settings, FileText, 
  TrendingUp, Vote, DollarSign, AlertTriangle, Loader2, RefreshCw,
  Clock, CheckCircle, XCircle, BarChart3
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [topContestants, setTopContestants] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [activeRound, setActiveRound] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/admin');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/');
    } else {
      fetchStats();
    }
  }, [session, status]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setTopContestants(data.topContestants || []);
        setRecentTransactions(data.recentTransactions || []);
        setActiveRound(data.activeRound);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || (session?.user?.role !== 'ADMIN' && status !== 'unauthenticated')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/contestants', label: 'Contestants', icon: Users },
    { href: '/admin/rounds', label: 'Rounds', icon: Trophy },
    { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-64px)] hidden md:block">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  item.href === '/admin' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </div>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <Button onClick={fetchStats} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Revenue</p>
                        <p className="text-2xl font-bold">₦{((stats?.totalRevenue || 0) / 100).toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Today's Votes</p>
                        <p className="text-2xl font-bold">{(stats?.todayVotes || 0).toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Vote className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Pending Approvals</p>
                        <p className="text-2xl font-bold">{stats?.pendingContestants || 0}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Flagged Transactions</p>
                        <p className="text-2xl font-bold">{stats?.flaggedTransactions || 0}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Active Round */}
              {activeRound && (
                <Card className="mb-8 border-green-200 bg-green-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge className="bg-green-600 mb-2">Active Round</Badge>
                        <h3 className="text-xl font-bold">{activeRound.name}</h3>
                        <p className="text-gray-600">
                          Ends: {new Date(activeRound.endDate).toLocaleString()}
                        </p>
                      </div>
                      <Link href="/admin/rounds">
                        <Button>Manage Rounds</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Top Contestants */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      Top Contestants
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topContestants.length > 0 ? (
                      <div className="space-y-3">
                        {topContestants.slice(0, 5).map((contestant, index) => (
                          <div key={contestant._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              index === 0 ? 'bg-yellow-400 text-white' :
                              index === 1 ? 'bg-gray-300' :
                              index === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{contestant.stageName}</p>
                              <p className="text-sm text-gray-500">{contestant.country}</p>
                            </div>
                            <Badge variant="secondary">{contestant.totalVotes} votes</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No contestants yet</p>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-500" />
                      Recent Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentTransactions.length > 0 ? (
                      <div className="space-y-3">
                        {recentTransactions.slice(0, 5).map((tx) => (
                          <div key={tx._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                            <div>
                              <p className="font-medium text-sm">{tx.reference}</p>
                              <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">₦{(tx.amountPaid / 100).toLocaleString()}</p>
                              <Badge variant={tx.status === 'SUCCESS' ? 'default' : tx.status === 'PENDING' ? 'secondary' : 'destructive'} className="text-xs">
                                {tx.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No transactions yet</p>
                    )}
                    <Link href="/admin/transactions" className="block mt-4">
                      <Button variant="outline" className="w-full">View All Transactions</Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/admin/contestants?status=PENDING">
                      <Button variant="outline">
                        <Clock className="w-4 h-4 mr-2" /> Review Pending ({stats?.pendingContestants || 0})
                      </Button>
                    </Link>
                    <Link href="/admin/rounds">
                      <Button variant="outline">
                        <Trophy className="w-4 h-4 mr-2" /> Manage Rounds
                      </Button>
                    </Link>
                    <Link href="/admin/transactions?export=csv">
                      <Button variant="outline">
                        <FileText className="w-4 h-4 mr-2" /> Export CSV
                      </Button>
                    </Link>
                    <Link href="/admin/settings">
                      <Button variant="outline">
                        <Settings className="w-4 h-4 mr-2" /> Settings
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
