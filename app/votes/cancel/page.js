'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function VoteCancelPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <CardTitle className="text-xl">Payment Cancelled</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Your payment was cancelled. No charges were made to your account.
            </p>
            
            {reference && (
              <p className="text-sm text-gray-500">
                Reference: {reference}
              </p>
            )}

            <div className="flex flex-col gap-2 pt-4">
              <Link href="/contestants">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Contestants
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Go to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
