'use client';
import { supabase } from '@/lib/supabaseClient';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const requestInProgress = useRef(false);

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (requestInProgress.current) return;
    requestInProgress.current = true;
    setLoading(true);
    setError('');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirectTo = `${baseUrl}/auth/callback`;

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (authError) {
        setError(authError.message);
      } else {
        setSent(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      requestInProgress.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleMagicLink();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md animate-slide-up">

        {sent ? (
          /* ── Confirmation state ── */
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-slate-200 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h2>
            <p className="text-slate-500 text-sm mb-1">We sent a sign-in link to</p>
            <p className="font-semibold text-slate-800 mb-4 break-all">{email}</p>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Click the link in the email to continue. It expires in 60 minutes.
            </p>
            <button
              onClick={() => { setSent(false); setError(''); }}
              className="text-indigo-600 text-sm font-medium hover:underline transition-colors"
            >
              Use a different email address
            </button>
          </div>
        ) : (
          /* ── Form state ── */
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="text-center mb-7">
              <Link
                href="/"
                className="inline-block text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-5 tracking-tight"
              >
                Accordiax
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">Sign in to your account</h1>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Enter your email and we will send you a secure sign-in link. No password needed.
              </p>
            </div>

            <div className="space-y-4">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
              <Button onClick={handleMagicLink} loading={loading} className="w-full">
                Send sign-in link
              </Button>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
              )}
            </div>

            <div className="mt-6 text-center space-y-2">
              <p className="text-xs text-slate-400">
                New to Accordiax?{' '}
                <Link href="/how-it-works" className="text-indigo-600 font-medium hover:underline">
                  See how it works
                </Link>
              </p>
              <Link href="/" className="block text-xs text-slate-400 hover:text-slate-600 transition-colors">
                Back to home
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
