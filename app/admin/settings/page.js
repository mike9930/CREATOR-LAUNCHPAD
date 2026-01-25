'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';
import { Settings, Loader2, Save, LayoutDashboard, Users, Trophy, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/admin/settings');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/');
    } else {
      fetchSettings();
    }
  }, [session, status]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || {});
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
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
                  item.href === '/admin/settings' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
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
            <h1 className="text-2xl font-bold">Settings</h1>
            <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Settings
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Voting Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Voting Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Vote Price (in Kobo)</Label>
                    <Input
                      type="number"
                      min={100}
                      value={settings.votePrice || 5000}
                      onChange={(e) => setSettings({ ...settings, votePrice: parseInt(e.target.value) })}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Current: ₦{((settings.votePrice || 5000) / 100).toFixed(2)} per vote
                    </p>
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Input
                      value={settings.currency || 'NGN'}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Max Votes per Purchase</Label>
                    <Input
                      type="number"
                      min={1}
                      value={settings.maxVotesPerPurchase || 1000}
                      onChange={(e) => setSettings({ ...settings, maxVotesPerPurchase: parseInt(e.target.value) })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Site Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Site Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Site Name</Label>
                    <Input
                      value={settings.siteName || 'Africa One Voice'}
                      onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Site Description</Label>
                    <Input
                      value={settings.siteDescription || ''}
                      onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Support Email</Label>
                    <Input
                      type="email"
                      value={settings.supportEmail || ''}
                      onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Prize Pool */}
              <Card>
                <CardHeader>
                  <CardTitle>Prize Pool (₦)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {['first', 'second', 'third', 'fourth', 'fifth'].map((place, index) => (
                    <div key={place}>
                      <Label>{index + 1}{['st', 'nd', 'rd', 'th', 'th'][index]} Place</Label>
                      <Input
                        type="number"
                        min={0}
                        value={settings.prizePool?.[place] || 0}
                        onChange={(e) => setSettings({
                          ...settings,
                          prizePool: { ...settings.prizePool, [place]: parseInt(e.target.value) }
                        })}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Social Media Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {['facebook', 'twitter', 'instagram', 'tiktok'].map((platform) => (
                    <div key={platform}>
                      <Label className="capitalize">{platform}</Label>
                      <Input
                        placeholder={`https://${platform}.com/...`}
                        value={settings.socialLinks?.[platform] || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          socialLinks: { ...settings.socialLinks, [platform]: e.target.value }
                        })}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
