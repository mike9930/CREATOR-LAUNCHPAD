'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Mail, Lock, User, Phone, Eye, EyeOff, CheckCircle, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { AFRICAN_COUNTRIES } from '@/lib/constants';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') || 'VOTER';

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '', // Optional
    country: '',
    role: defaultRole === 'CONTESTANT' ? 'CONTESTANT' : 'VOTER',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined, // Phone is optional
          country: formData.country,
          role: formData.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setUserId(data.userId);
      if (data.devOtpHint) {
        setOtpHint(data.devOtpHint);
      }
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }
        throw new Error(data.error || 'Verification failed');
      }

      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setResending(true);
    setError('');

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If rate limited with waitSeconds, set cooldown
        if (data.waitSeconds) {
          setResendCooldown(data.waitSeconds);
        }
        throw new Error(data.error || 'Failed to resend code');
      }

      setAttemptsRemaining(5); // Reset attempts
      if (data.devOtpHint) {
        setOtpHint(data.devOtpHint);
      }
      setError(''); // Clear any previous errors
      
      // Start 60-second cooldown
      setResendCooldown(60);
      
      // Show success message instead of alert
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  // Cooldown timer effect
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Link href="/" className="mx-auto mb-4">
              <Image
                src="/images/aov-logo.png"
                alt="Africa One Voice – Pan-African Talent Show"
                width={80}
                height={80}
                className="h-20 w-auto mx-auto"
              />
            </Link>
            <CardTitle className="text-2xl">
              {step === 1 && 'Create Account'}
              {step === 2 && 'Verify Email'}
              {step === 3 && 'Success!'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Join Africa One Voice today'}
              {step === 2 && `Enter the code sent to ${formData.email}`}
              {step === 3 && 'Your account is ready'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Registration Form */}
            {step === 1 && (
              <form onSubmit={handleRegister} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label>I want to</Label>
                  <RadioGroup
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="VOTER" id="voter" />
                      <Label htmlFor="voter" className="cursor-pointer">Vote for contestants</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="CONTESTANT" id="contestant" />
                      <Label htmlFor="contestant" className="cursor-pointer">Compete as contestant</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">We'll send a verification code to this email</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+234 XXX XXX XXXX"
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {AFRICAN_COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            )}

            {/* Step 2: Email OTP Verification */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {otpHint && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-blue-800">
                      🚧 Dev Mode: {otpHint}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-center mb-4">
                  <Mail className="w-12 h-12 mx-auto text-green-600 mb-2" />
                  <p className="text-gray-600">Check your email for the 6-digit code</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                    required
                  />
                  <p className="text-xs text-gray-500 text-center">
                    {attemptsRemaining} attempts remaining • Code expires in 10 minutes
                  </p>
                </div>

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading || otpCode.length !== 6}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                  ) : (
                    'Verify Email'
                  )}
                </Button>

                <div className="text-center">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={handleResendOtp}
                    disabled={resending || resendCooldown > 0}
                    className="text-green-600"
                  >
                    {resending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                    ) : resendCooldown > 0 ? (
                      <><RefreshCw className="w-4 h-4 mr-2" /> Resend in {resendCooldown}s</>
                    ) : (
                      <><RefreshCw className="w-4 h-4 mr-2" /> Resend Code</>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <p className="text-gray-600">Your email has been verified! You can now sign in.</p>
                <div className="space-y-2">
                  <Link href="/auth/login">
                    <Button className="w-full bg-green-600 hover:bg-green-700">Sign In</Button>
                  </Link>
                  {formData.role === 'CONTESTANT' && (
                    <p className="text-sm text-gray-500">
                      After signing in, complete your contestant profile to start receiving votes!
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">Already have an account? </span>
                <Link href="/auth/login" className="text-green-600 hover:underline font-medium">
                  Sign In
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
