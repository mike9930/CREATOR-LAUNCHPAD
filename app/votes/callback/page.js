'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VoteCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('reference');
  const [status, setStatus] = useState('verifying'); // verifying, success, failed
  const [transaction, setTransaction] = useState(null);

  useEffect(() => {
    if (reference) {
      verifyPayment();
    } else {
      setStatus('failed');
    }
  }, [reference]);

  const verifyPayment = async () => {
    try {
      const res = await fetch(`/api/votes/verify?reference=${reference}`);
      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setTransaction(data.transaction);
      } else {
        setStatus('failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            {status === 'verifying' && (
              <>
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-green-600 animate-spin" />
                <CardTitle>Verifying Payment...</CardTitle>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <CardTitle className="text-green-600">Vote Successful!</CardTitle>
              </>
            )}
            {status === 'failed' && (
              <>
                <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
                <CardTitle className="text-red-600">Payment Failed</CardTitle>
              </>
            )}
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status === 'verifying' && (
              <p className="text-gray-600">Please wait while we confirm your payment...</p>
            )}
            {status === 'success' && transaction && (
              <>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{transaction.votesPurchased} Votes</p>
                  <p className="text-gray-600">credited successfully!</p>
                </div>
                <p className="text-gray-600">Thank you for supporting your favorite contestant!</p>
                <div className="flex flex-col gap-2">
                  <Link href={`/contestants/${transaction.contestantId}`}>
                    <Button className="w-full bg-green-600 hover:bg-green-700">Vote Again</Button>
                  </Link>
                  <Link href="/leaderboard">
                    <Button variant="outline" className="w-full">View Leaderboard</Button>
                  </Link>
                </div>
              </>
            )}
            {status === 'failed' && (
              <>
                <p className="text-gray-600">Your payment could not be verified. If you were charged, please contact support.</p>
                <div className="flex flex-col gap-2">
                  <Link href="/contestants">
                    <Button className="w-full">Try Again</Button>
                  </Link>
                  <Button variant="outline" className="w-full" onClick={() => router.back()}>
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
