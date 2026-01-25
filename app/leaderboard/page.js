'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Trophy, Medal, Vote, Loader2, TrendingUp, Filter } from 'lucide-react';
import { AFRICAN_COUNTRIES, CATEGORIES } from '@/lib/constants';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeRound, setActiveRound] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [selectedRound, setSelectedRound] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, [category, country, selectedRound]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (category) params.set('category', category);
      if (country) params.set('country', country);
      if (selectedRound) params.set('roundId', selectedRound);

      const res = await fetch(`/api/leaderboard?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setActiveRound(data.activeRound);
        setRounds(data.rounds || []);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return rank;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 via-yellow-600 to-amber-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-12 h-12 mr-4" />
            <h1 className="text-3xl md:text-4xl font-bold">Leaderboard</h1>
          </div>
          <p className="text-center text-yellow-100 text-lg">
            {activeRound ? `Current Round: ${activeRound.name}` : 'Overall Rankings'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={selectedRound} onValueChange={setSelectedRound}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Current Round" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Current Round</SelectItem>
                  {rounds.map((round) => (
                    <SelectItem key={round._id} value={round._id}>
                      {round.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Countries</SelectItem>
                  {AFRICAN_COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(category || country || selectedRound) && (
                <Button variant="ghost" onClick={() => { setCategory(''); setCountry(''); setSelectedRound(''); }}>
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <div className="container mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="space-y-3">
            {/* Top 3 Cards */}
            {leaderboard.slice(0, 3).length > 0 && (
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {leaderboard.slice(0, 3).map((entry) => (
                  <Link key={entry.contestant._id} href={`/contestants/${entry.contestant._id}`}>
                    <Card className={`${getRankStyle(entry.rank)} overflow-hidden hover:shadow-xl transition-shadow cursor-pointer`}>
                      <CardContent className="p-6 text-center">
                        <div className="text-5xl mb-3">{getRankIcon(entry.rank)}</div>
                        <h3 className="font-bold text-xl mb-1">{entry.contestant.stageName}</h3>
                        <p className="opacity-80 text-sm mb-3">{entry.contestant.country} • {entry.contestant.category}</p>
                        <div className="text-3xl font-bold">{entry.totalVotes.toLocaleString()}</div>
                        <p className="text-sm opacity-80">votes</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* Rest of leaderboard */}
            {leaderboard.slice(3).map((entry) => (
              <Link key={entry.contestant._id} href={`/contestants/${entry.contestant._id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getRankStyle(entry.rank)}`}>
                      {entry.rank}
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-semibold">{entry.contestant.stageName}</h3>
                      <p className="text-sm text-gray-500">{entry.contestant.country} • {entry.contestant.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600 text-lg">{entry.totalVotes.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">votes</div>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-4">
                      <Vote className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No rankings yet</h3>
            <p className="text-gray-500">Leaderboard will appear once voting begins!</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
