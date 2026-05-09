'use client';
import { supabase } from '@/lib/supabaseClient';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const requestInProgress = useRef(false);

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email address.');
      return;
    }
    if (requestInProgress.current) return;
    requestInProgress.current = true;
    setLoading(true);
    setMessage('');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirectTo = `${baseUrl}/auth/callback`;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo }
      });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('✨ Magic link sent! Check your email.');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
      requestInProgress.current = false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-slate-200">
          <h1 className="text-3xl font-bold text-center text-slate-800">Welcome back</h1>
          <p className="text-slate-500 text-center mt-1">Sign in to continue</p>
          <div className="mt-8 space-y-4">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Button onClick={handleMagicLink} loading={loading} className="w-full">
              Send magic link
            </Button>
            {message && <p className="text-sm text-center text-slate-600">{message}</p>}
            <p className="text-center text-xs text-slate-400">
              New to Accordiax? <Link href="/how-it-works" className="text-blue-600">Learn more</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}