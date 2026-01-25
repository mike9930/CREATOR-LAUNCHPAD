'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Trophy, Users, Vote, Star, Play, ArrowRight, Award, Music, Mic2, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [settings, setSettings] = useState(null);
  const [featuredContestants, setFeaturedContestants] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, contestantsRes, leaderboardRes] = await Promise.all([
        fetch('/api/settings/public'),
        fetch('/api/contestants?featured=true&limit=6'),
        fetch('/api/leaderboard?limit=5'),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data);
      }
      if (contestantsRes.ok) {
        const data = await contestantsRes.json();
        setFeaturedContestants(data.contestants || []);
      }
      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const prizePool = settings?.prizePool || {
    first: 500000,
    second: 200000,
    third: 150000,
    fourth: 100000,
    fifth: 50000,
  };

  const prizes = [
    { position: '1st', amount: prizePool.first, color: 'from-yellow-400 to-yellow-600', icon: '🥇' },
    { position: '2nd', amount: prizePool.second, color: 'from-gray-300 to-gray-500', icon: '🥈' },
    { position: '3rd', amount: prizePool.third, color: 'from-amber-600 to-amber-800', icon: '🥉' },
    { position: '4th', amount: prizePool.fourth, color: 'from-green-500 to-green-700', icon: '4️⃣' },
    { position: '5th', amount: prizePool.fifth, color: 'from-blue-500 to-blue-700', icon: '5️⃣' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1576514129883-2f1d47a65da6?w=1920)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80" />
        
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <Badge className="mb-4 bg-green-600 text-white px-4 py-1 text-sm">
            {settings?.activeRound ? `${settings.activeRound.name} - Voting Open!` : 'Season 1'}
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="text-green-400">Africa</span>
            <span className="text-yellow-400"> One</span>
            <span className="text-red-400"> Voice</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
            The Premier Pan-African Digital Talent Show. 
            Showcase your talent and win from a prize pool of <span className="text-yellow-400 font-bold">₦1,000,000!</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contestants">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8">
                <Vote className="w-5 h-5 mr-2" />
                Vote Now
              </Button>
            </Link>
            <Link href="/auth/register?role=CONTESTANT">
              <Button size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-white hover:text-black">
                <Mic2 className="w-5 h-5 mr-2" />
                Apply as Contestant
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Prize Pool Section */}
      <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <Trophy className="inline w-10 h-10 text-yellow-400 mr-2" />
              Prize Pool: ₦1,000,000
            </h2>
            <p className="text-gray-400">Top 5 contestants share the grand prize!</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {prizes.map((prize, index) => (
              <Card key={index} className={`bg-gradient-to-br ${prize.color} border-0 overflow-hidden transform hover:scale-105 transition-transform`}>
                <CardContent className="p-6 text-center text-white">
                  <div className="text-4xl mb-2">{prize.icon}</div>
                  <div className="text-lg font-bold">{prize.position} Place</div>
                  <div className="text-2xl font-bold mt-2">₦{prize.amount.toLocaleString()}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Users, title: 'Register', desc: 'Create your account as a voter or contestant' },
              { icon: Play, title: 'Audition', desc: 'Contestants upload a 60-90s video showcasing talent' },
              { icon: Vote, title: 'Vote', desc: 'Support your favorites with paid votes (₦50/vote)' },
              { icon: Award, title: 'Win', desc: 'Top 5 contestants win cash prizes!' },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600 mb-2">Step {index + 1}</div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/how-it-works">
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                Learn More <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Contestants */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">
              <Star className="inline w-8 h-8 text-yellow-500 mr-2" />
              Featured Contestants
            </h2>
            <Link href="/contestants">
              <Button variant="ghost" className="text-green-600">
                View All <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <CardContent className="p-4">
                    <div className="h-6 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredContestants.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {featuredContestants.map((contestant) => (
                <Link key={contestant._id} href={`/contestants/${contestant._id}`}>
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
                    <div className="relative h-48 bg-gradient-to-br from-green-400 to-green-600">
                      {contestant.profileImageUrl ? (
                        <img src={contestant.profileImageUrl} alt={contestant.stageName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-16 h-16 text-white/50" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-yellow-500">
                          <Star className="w-3 h-3 mr-1" /> Featured
                        </Badge>
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button className="bg-green-600">Vote Now</Button>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg">{contestant.stageName}</h3>
                      <p className="text-gray-500 text-sm">{contestant.country} • {contestant.category}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="secondary">{contestant.totalVotes.toLocaleString()} votes</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Featured contestants coming soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">
              <Trophy className="inline w-8 h-8 text-yellow-500 mr-2" />
              Current Leaderboard
            </h2>
            <Link href="/leaderboard">
              <Button variant="ghost" className="text-green-600">
                Full Leaderboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="space-y-4">
              {leaderboard.map((entry, index) => (
                <Link key={entry.contestant._id} href={`/contestants/${entry.contestant._id}`}>
                  <div className={`flex items-center p-4 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300' :
                    index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300' :
                    index === 2 ? 'bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-300' :
                    'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 ? 'bg-yellow-400 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {entry.rank}
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-semibold">{entry.contestant.stageName}</h3>
                      <p className="text-sm text-gray-500">{entry.contestant.country} • {entry.contestant.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{entry.totalVotes.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">votes</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Leaderboard will appear once voting begins!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-africa">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Showcase Your Talent?</h2>
          <p className="text-xl mb-8 opacity-90">Join Africa's biggest digital talent competition today!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register?role=CONTESTANT">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8">
                Apply Now
              </Button>
            </Link>
            <Link href="/contestants">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8">
                Start Voting
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
