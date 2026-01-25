import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Rules & Regulations</h1>
          <p className="text-red-100 text-lg">Please read carefully before participating</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Eligibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Eligibility Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Must be an African citizen or of African descent</li>
                <li>Minimum age of 16 years old</li>
                <li>Must have a valid email address and phone number</li>
                <li>Contestants must submit an original audition video (60-90 seconds)</li>
                <li>Video content must be appropriate and family-friendly</li>
                <li>One entry per person - multiple accounts are prohibited</li>
              </ul>
            </CardContent>
          </Card>

          {/* Voting Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Voting Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li><strong>All votes are paid</strong> - No free voting available</li>
                <li>Vote price is ₦50 per vote (subject to change by admin)</li>
                <li>Votes can only be cast during active voting rounds</li>
                <li>All payments are processed securely through Paystack</li>
                <li>Votes are credited immediately upon successful payment</li>
                <li>No refunds for purchased votes</li>
                <li>Maximum 1000 votes per transaction</li>
              </ul>
            </CardContent>
          </Card>

          {/* Competition Structure */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Competition Structure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li><strong>Round 1:</strong> Top 50 contestants selected from approved entries</li>
                <li><strong>Round 2:</strong> Top 25 advance based on votes</li>
                <li><strong>Round 3:</strong> Top 10 advance based on votes</li>
                <li><strong>Final Round:</strong> Top 5 finalists compete for the grand prize</li>
                <li>Each round has a specific start and end date announced by admin</li>
                <li>Votes reset at the beginning of each round (overall votes are tracked separately)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Prizes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Prize Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { place: '1st', amount: '₦500,000' },
                  { place: '2nd', amount: '₦200,000' },
                  { place: '3rd', amount: '₦150,000' },
                  { place: '4th', amount: '₦100,000' },
                  { place: '5th', amount: '₦50,000' },
                ].map((prize) => (
                  <div key={prize.place} className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="font-bold text-green-800">{prize.place} Place</div>
                    <div className="text-xl font-bold text-green-600">{prize.amount}</div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-gray-600 text-sm">
                * Prize amounts are subject to applicable taxes and deductions as per Nigerian law.
              </p>
            </CardContent>
          </Card>

          {/* Prohibited Actions */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="w-6 h-6" />
                Prohibited Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Creating multiple accounts to vote or compete</li>
                <li>Using bots, scripts, or automated systems for voting</li>
                <li>Fraudulent payment activities</li>
                <li>Vote manipulation or vote buying schemes</li>
                <li>Submitting copyrighted content without permission</li>
                <li>Offensive, violent, or inappropriate content</li>
                <li>Harassment of other contestants or voters</li>
                <li>Impersonating another person</li>
              </ul>
              <div className="mt-4 p-4 bg-red-50 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <p className="text-red-800 text-sm">
                  <strong>Warning:</strong> Violation of any rules may result in immediate disqualification,
                  account suspension, and forfeiture of any prizes. The admin reserves the right to
                  investigate suspicious activities and take appropriate action.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Questions?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                If you have any questions about the rules or need clarification, please contact us at:
              </p>
              <p className="font-medium text-green-600 mt-2">support@africaonevoice.com</p>
            </CardContent>
          </Card>

        </div>
      </div>

      <Footer />
    </div>
  );
}
