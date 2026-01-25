import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import AuthProvider from '@/components/AuthProvider';

export const metadata = {
  title: 'Africa One Voice - Pan-African Digital Talent Show',
  description: 'Discover and vote for Africa\'s brightest talents. Win ₦1,000,000 in prizes!',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
