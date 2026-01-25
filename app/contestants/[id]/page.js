'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Vote, Share2, MapPin, Music, Loader2, Plus, Minus, ExternalLink, Trophy, ArrowLeft, Facebook, Twitter } from 'lucide-react';
import { toast } from 'sonner';

export default function ContestantProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [contestant, setContestant] = useState(null);
  const [activeRound, setActiveRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voteCount, setVoteCount] = useState(1);
  const [votingLoading, setVotingLoading] = useState(false);
  const [votePrice, setVotePrice] = useState(5000);

  useEffect(() => {
    fetchContestant();
    fetchSettings();
  }, [params.id]);

  const fetchContestant = async () => {
    try {
      const res = await fetch(`/api/contestants/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setContestant(data.contestant);
        setActiveRound(data.activeRound);
      } else {
        router.push('/contestants');
      }
    } catch (error) {
      console.error('Failed to fetch contestant:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/public');
      if (res.ok) {
        const data = await res.json();
        setVotePrice(data.votePrice || 5000);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleVote = async () => {
    if (!session) {
      router.push(`/auth/login?callbackUrl=/contestants/${params.id}`);
      return;
    }

    if (!activeRound) {
      toast.error('No active voting round');
      return;
    }

    setVotingLoading(true);
    try {
      const res = await fetch('/api/votes/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contestantId: params.id,
          voteCount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      // Redirect to Paystack
      window.location.href = data.authorizationUrl;
    } catch (error) {
      toast.error(error.message);
    } finally {
      setVotingLoading(false);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = contestant ? `Vote for ${contestant.stageName} on Africa One Voice!` : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  if (!contestant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-600">Contestant not found</h1>
          <Link href="/contestants">
            <Button className="mt-4">Back to Contestants</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalAmount = (votePrice * voteCount) / 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Link href="/contestants" className="inline-flex items-center text-green-600 hover:underline mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Contestants
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video */}
            <Card className="overflow-hidden">
              {contestant.videoEmbed ? (
                <div className="aspect-video">
                  <iframe
                    src={contestant.videoEmbed}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                  <Music className="w-16 h-16 text-gray-400" />
                  <p className="text-gray-500 ml-4">No video uploaded yet</p>
                </div>
              )}
            </Card>

            {/* Bio */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{contestant.stageName}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>{contestant.country}</span>
                      {contestant.state && <span>• {contestant.state}</span>}
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">{contestant.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="font-bold text-lg">{contestant.totalVotes.toLocaleString()}</span>
                    <span className="text-gray-500">total votes</span>
                  </div>
                </div>

                {contestant.bio && (
                  <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold mb-2">About</h3>
                    <p className="text-gray-600">{contestant.bio}</p>
                  </div>
                )}

                {/* Social Links */}
                {contestant.socialLinks && Object.values(contestant.socialLinks).some(v => v) && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Connect</h3>
                    <div className="flex gap-3">
                      {contestant.socialLinks.instagram && (
                        <a href={contestant.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700">
                          <Badge variant="outline">Instagram</Badge>
                        </a>
                      )}
                      {contestant.socialLinks.twitter && (
                        <a href={contestant.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-500">
                          <Badge variant="outline">Twitter</Badge>
                        </a>
                      )}
                      {contestant.socialLinks.tiktok && (
                        <a href={contestant.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-700">
                          <Badge variant="outline">TikTok</Badge>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Voting Panel */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center">
                  <Vote className="w-5 h-5 mr-2" />
                  Vote for {contestant.stageName}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {!activeRound ? (
                  <Alert>
                    <AlertDescription>
                      Voting is currently closed. Check back when a new round opens!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">{activeRound.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Ends: {new Date(activeRound.endDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Number of Votes</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setVoteCount(Math.max(1, voteCount - 1))}
                          disabled={voteCount <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          max={1000}
                          value={voteCount}
                          onChange={(e) => setVoteCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                          className="text-center text-lg font-bold"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setVoteCount(Math.min(1000, voteCount + 1))}
                          disabled={voteCount >= 1000}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex justify-center gap-2 mt-2">
                        {[5, 10, 25, 50, 100].map((n) => (
                          <Button
                            key={n}
                            variant="ghost"
                            size="sm"
                            onClick={() => setVoteCount(n)}
                            className={voteCount === n ? 'bg-green-100' : ''}
                          >
                            {n}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>Price per vote</span>
                        <span>₦{(votePrice / 100).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-green-600">₦{totalAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                      onClick={handleVote}
                      disabled={votingLoading}
                    >
                      {votingLoading ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                      ) : (
                        <><Vote className="w-5 h-5 mr-2" /> Pay & Vote Now</>
                      )}
                    </Button>

                    <p className="text-xs text-center text-gray-500">
                      Secure payment powered by Paystack
                    </p>
                  </>
                )}

                {/* Share */}
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Share this contestant</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')}
                    >
                      <Facebook className="w-4 h-4 mr-2" /> Facebook
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank')}
                    >
                      <Twitter className="w-4 h-4 mr-2" /> Twitter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
