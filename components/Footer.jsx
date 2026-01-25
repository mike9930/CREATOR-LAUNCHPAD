import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-full gradient-africa flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="font-bold text-xl">
                <span className="text-green-500">Africa</span>
                <span className="text-yellow-500"> One</span>
                <span className="text-red-500"> Voice</span>
              </span>
            </div>
            <p className="text-gray-400 max-w-md">
              The premier pan-African digital talent show. Discover, support, and vote for Africa's brightest talents.
              Total prize pool of ₦1,000,000!
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/contestants" className="text-gray-400 hover:text-white">Contestants</Link></li>
              <li><Link href="/leaderboard" className="text-gray-400 hover:text-white">Leaderboard</Link></li>
              <li><Link href="/how-it-works" className="text-gray-400 hover:text-white">How It Works</Link></li>
              <li><Link href="/rules" className="text-gray-400 hover:text-white">Rules & Regulations</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-gray-400">
                <Mail className="w-4 h-4" />
                <span>support@africaonevoice.com</span>
              </li>
            </ul>
            <div className="mt-4">
              <Link href="/auth/register?role=CONTESTANT" className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Apply as Contestant
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Africa One Voice. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
