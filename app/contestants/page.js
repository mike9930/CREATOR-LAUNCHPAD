'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search, Filter, Music, Vote, Loader2 } from 'lucide-react';
import { AFRICAN_COUNTRIES, CATEGORIES } from '@/lib/constants';

export default function ContestantsPage() {
  const [contestants, setContestants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    fetchContestants();
  }, [search, category, country, page]);

  const fetchContestants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      });
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (country) params.set('country', country);

      const res = await fetch(`/api/contestants?${params}`);
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

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setCountry('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Meet Our Contestants</h1>
          <p className="text-green-100 text-lg">Vote for your favorite African talents and help them win!</p>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search contestants..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>
              <Select value={category || 'all'} onValueChange={(v) => { setCategory(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={country || 'all'} onValueChange={(v) => { setCountry(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {AFRICAN_COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(search || category || country) && (
                <Button variant="ghost" onClick={clearFilters}>Clear</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contestants Grid */}
      <div className="container mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : contestants.length > 0 ? (
          <>
            <p className="text-gray-600 mb-6">{pagination.total} contestant(s) found</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {contestants.map((contestant) => (
                <Link key={contestant._id} href={`/contestants/${contestant._id}`}>
                  <Card className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group h-full">
                    <div className="relative h-48 bg-gradient-to-br from-green-400 to-green-600">
                      {contestant.profileImageUrl ? (
                        <img src={contestant.profileImageUrl} alt={contestant.stageName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-16 h-16 text-white/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button className="bg-green-600 hover:bg-green-700">
                          <Vote className="w-4 h-4 mr-2" /> Vote
                        </Button>
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-white/90 text-gray-800">{contestant.category}</Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg truncate">{contestant.stageName}</h3>
                      <p className="text-gray-500 text-sm">{contestant.country}</p>
                      <div className="flex items-center justify-between mt-3">
                        <Badge variant="secondary" className="bg-green-50 text-green-700">
                          {contestant.totalVotes.toLocaleString()} votes
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-gray-600">
                  Page {page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <Music className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No contestants found</h3>
            <p className="text-gray-500">Try adjusting your filters or check back later.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
