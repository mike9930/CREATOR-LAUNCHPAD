'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { CheckCircle, Loader2, PartyPopper, Vote, Trophy, Share2 } from 'lucide-react';

export default function VoteSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('reference');
  const token = searchParams.get('token'); // PayPal returns this
  
  const [status, setStatus] = useState('verifying');
  const [transaction, setTransaction] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (reference) {
      verifyPayment();
    } else {
      setStatus('error');
      setError('No payment reference found');
    }
  }, [reference]);

  const verifyPayment = async () => {
    try {
      // Call verify endpoint to capture payment and credit votes
      const res = await fetch('/api/paypal/verify-or-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setTransaction(data.transaction);
      } else {
        setStatus('error');
        setError(data.message || data.error || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setStatus('error');
      setError('Failed to verify payment');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center pb-2">
            {status === 'verifying' && (
              <>
                <Loader2 className="w-20 h-20 mx-auto mb-4 text-green-600 animate-spin" />
                <CardTitle className="text-xl">Verifying Payment...</CardTitle>
              </>
            )}
            {status === 'success' && (
              <>
                <div className="relative">
                  <CheckCircle className="w-20 h-20 mx-auto text-green-600" />
                  <PartyPopper className="w-8 h-8 absolute top-0 right-1/4 text-yellow-500 animate-bounce" />
                </div>
                <CardTitle className="text-2xl text-green-600 mt-4">Vote Successful!</CardTitle>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-4xl">😔</span>
                </div>
                <CardTitle className="text-xl text-red-600">Something Went Wrong</CardTitle>
              </>
            )}
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {status === 'verifying' && (
              <p className="text-gray-600">Please wait while we confirm your payment and credit your votes...</p>
            )}

            {status === 'success' && transaction && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Vote className="w-6 h-6 text-green-600" />
                    <span className="text-4xl font-bold text-green-600">{transaction.votesQty}</span>
                  </div>
                  <p className="text-green-700 font-medium">votes credited successfully!</p>
                  <p className="text-sm text-gray-500 mt-2">Reference: {transaction.reference}</p>
                </div>

                <p className="text-gray-600">
                  Thank you for supporting your favorite contestant! Your votes have been added to their total.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={`/contestants/${transaction.contestantId}`} className="flex-1">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <Vote className="w-4 h-4 mr-2" /> Vote Again
                    </Button>
                  </Link>
                  <Link href="/leaderboard" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Trophy className="w-4 h-4 mr-2" /> View Leaderboard
                    </Button>
                  </Link>
                </div>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'I voted on Africa One Voice!',
                        text: 'Support African talent! Vote for your favorites on Africa One Voice.',
                        url: window.location.origin,
                      });
                    }
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" /> Share with Friends
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <p className="text-gray-600">{error}</p>
                <p className="text-sm text-gray-500">
                  If you were charged, please contact support with your payment reference.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/contestants" className="flex-1">
                    <Button className="w-full">Try Again</Button>
                  </Link>
                  <Button variant="outline" className="flex-1" onClick={() => router.back()}>
                    Go Back
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
