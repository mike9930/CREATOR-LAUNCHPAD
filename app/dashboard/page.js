'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { User, Trophy, Vote, Edit, Save, Loader2, ExternalLink, BarChart3, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { AFRICAN_COUNTRIES, CATEGORIES } from '@/lib/constants';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [contestantProfile, setContestantProfile] = useState(null);
  const [voteStats, setVoteStats] = useState(null);
  const [votingHistory, setVotingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [showProfileForm, setShowProfileForm] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/dashboard');
    } else if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setUserData(data.user);
        setContestantProfile(data.contestantProfile);
        setVoteStats(data.voteStats);
        setVotingHistory(data.votingHistory || []);
        
        if (data.contestantProfile) {
          setFormData(data.contestantProfile);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const url = contestantProfile ? `/api/contestants/${contestantProfile._id}` : '/api/contestants';
      const method = contestantProfile ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(contestantProfile ? 'Profile updated!' : 'Profile submitted for review!');
        setEditing(false);
        setShowProfileForm(false);
        fetchProfile();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save profile');
      }
    } catch (error) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  const isContestant = userData?.role === 'CONTESTANT';
  const isVoter = userData?.role === 'VOTER';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{userData?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{userData?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <Badge variant={isContestant ? 'default' : 'secondary'}>{userData?.role}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Verified</p>
                  <Badge variant={userData?.phoneVerified ? 'default' : 'destructive'}>
                    {userData?.phoneVerified ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contestant Stats */}
          {isContestant && contestantProfile && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Your Stats
                  </CardTitle>
                  <Badge variant={
                    contestantProfile.status === 'APPROVED' ? 'default' :
                    contestantProfile.status === 'PENDING' ? 'secondary' : 'destructive'
                  }>
                    {contestantProfile.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Trophy className="w-8 h-8 mx-auto text-green-600 mb-2" />
                    <p className="text-2xl font-bold text-green-600">{contestantProfile.totalVotes.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Total Votes</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Vote className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{voteStats?.votesByRound?.length || 0}</p>
                    <p className="text-sm text-gray-500">Rounds Participated</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Badge className="bg-yellow-500 mb-2">{contestantProfile.isFeatured ? 'Featured' : 'Standard'}</Badge>
                    <p className="text-sm text-gray-500 mt-2">{contestantProfile.category}</p>
                  </div>
                </div>
                {contestantProfile.status === 'PENDING' && (
                  <Alert className="mt-4">
                    <Clock className="w-4 h-4" />
                    <AlertDescription>
                      Your profile is under review. You'll be notified once approved.
                    </AlertDescription>
                  </Alert>
                )}
                {contestantProfile.status === 'REJECTED' && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      Your profile was rejected. {contestantProfile.rejectionReason || 'Please update and resubmit.'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Voter Stats */}
          {isVoter && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Vote className="w-5 h-5" />
                  Your Voting Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {votingHistory.length > 0 ? (
                  <div className="space-y-3">
                    {votingHistory.slice(0, 5).map((tx) => (
                      <div key={tx._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{tx.votesPurchased} votes</p>
                          <p className="text-sm text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={tx.status === 'SUCCESS' ? 'default' : 'secondary'}>{tx.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Vote className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p>You haven't voted yet</p>
                    <Link href="/contestants">
                      <Button className="mt-4 bg-green-600">Start Voting</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contestant Profile Section */}
        {(isContestant || showProfileForm) && (
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contestant Profile</CardTitle>
                {contestantProfile && !editing && (
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" /> Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {(editing || !contestantProfile) ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label>Stage Name *</Label>
                    <Input
                      value={formData.stageName || ''}
                      onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                      placeholder="Your stage name"
                    />
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Select value={formData.category || ''} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Country *</Label>
                    <Select value={formData.country || ''} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {AFRICAN_COUNTRIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>State/City</Label>
                    <Input
                      value={formData.state || ''}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Your city or state"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>YouTube Video URL</Label>
                    <Input
                      value={formData.youtubeVideoUrl || ''}
                      onChange={(e) => setFormData({ ...formData, youtubeVideoUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <p className="text-sm text-gray-500 mt-1">Upload your 60-90 second audition video to YouTube and paste the link here</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Bio</Label>
                    <Textarea
                      value={formData.bio || ''}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself and your talent..."
                      rows={4}
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-3">
                    <Button onClick={handleSaveProfile} disabled={saving || !formData.stageName || !formData.category || !formData.country} className="bg-green-600">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      {contestantProfile ? 'Save Changes' : 'Submit Profile'}
                    </Button>
                    {editing && (
                      <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Stage Name</p>
                      <p className="font-medium">{contestantProfile.stageName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium">{contestantProfile.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Country</p>
                      <p className="font-medium">{contestantProfile.country}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">State/City</p>
                      <p className="font-medium">{contestantProfile.state || 'Not specified'}</p>
                    </div>
                  </div>
                  {contestantProfile.bio && (
                    <div>
                      <p className="text-sm text-gray-500">Bio</p>
                      <p>{contestantProfile.bio}</p>
                    </div>
                  )}
                  {contestantProfile.youtubeVideoUrl && (
                    <div>
                      <p className="text-sm text-gray-500">Video</p>
                      <a href={contestantProfile.youtubeVideoUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline flex items-center gap-1">
                        View on YouTube <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                  <div className="pt-4">
                    <Link href={`/contestants/${contestantProfile._id}`}>
                      <Button variant="outline">View Public Profile</Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* CTA for voters to become contestants */}
        {isVoter && !showProfileForm && (
          <Card className="mt-8 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold mb-2">Want to compete?</h3>
              <p className="text-gray-600 mb-4">Create your contestant profile and join Africa One Voice!</p>
              <Button onClick={() => setShowProfileForm(true)} className="bg-green-600 hover:bg-green-700">
                Apply as Contestant
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
