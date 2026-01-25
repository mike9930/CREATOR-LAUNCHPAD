import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Play, Vote, Award, CreditCard, Trophy, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HowItWorksPage() {
  const steps = [
    {
      icon: Users,
      title: 'Create Your Account',
      description: 'Register as a voter to support your favorites, or as a contestant to showcase your talent.',
      details: ['Free registration', 'Choose your role', 'Verify your phone number'],
    },
    {
      icon: Play,
      title: 'Contestants Audition',
      description: 'Contestants upload a 60-90 second video showcasing their unique African talent.',
      details: ['YouTube video link', 'Singing, Dancing, Comedy & more', 'Admin review and approval'],
    },
    {
      icon: Vote,
      title: 'Cast Your Votes',
      description: 'Support your favorite contestants by purchasing votes. Every vote counts!',
      details: ['₦50 per vote (configurable)', 'Secure Paystack payments', 'Unlimited voting'],
    },
    {
      icon: Trophy,
      title: 'Winners Emerge',
      description: 'At the end of each round, top contestants advance. Final 5 share the ₦1,000,000 prize pool!',
      details: ['Multiple voting rounds', 'Top 50 → 25 → 10 → 5', 'Cash prizes for top 5'],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">How It Works</h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto">
            Join Africa's biggest digital talent competition in 4 simple steps
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="container mx-auto px-4 py-16">
        <div className="space-y-12">
          {steps.map((step, index) => (
            <div key={index} className={`flex flex-col md:flex-row items-center gap-8 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-green-600">Step {index + 1}</div>
                    <h2 className="text-2xl font-bold">{step.title}</h2>
                  </div>
                </div>
                <p className="text-gray-600 text-lg mb-4">{step.description}</p>
                <ul className="space-y-2">
                  {step.details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-600">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0">
                  <CardContent className="p-12 flex items-center justify-center">
                    <step.icon className="w-32 h-32 text-green-300" />
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prize Pool */}
      <div className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">
            <Trophy className="inline w-10 h-10 text-yellow-400 mr-2" />
            Prize Pool: ₦1,000,000
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {[
              { position: '1st', amount: 500000, color: 'from-yellow-400 to-yellow-600' },
              { position: '2nd', amount: 200000, color: 'from-gray-300 to-gray-500' },
              { position: '3rd', amount: 150000, color: 'from-amber-600 to-amber-800' },
              { position: '4th', amount: 100000, color: 'from-green-500 to-green-700' },
              { position: '5th', amount: 50000, color: 'from-blue-500 to-blue-700' },
            ].map((prize, index) => (
              <Card key={index} className={`bg-gradient-to-br ${prize.color} border-0`}>
                <CardContent className="p-6 text-center text-white">
                  <div className="font-bold text-lg">{prize.position}</div>
                  <div className="text-xl font-bold mt-1">₦{prize.amount.toLocaleString()}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8">Join thousands of Africans supporting local talent!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">Create Account</Button>
            </Link>
            <Link href="/contestants">
              <Button size="lg" variant="outline">Browse Contestants</Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
