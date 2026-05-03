'use client';
import { supabase } from '@/lib/supabaseClient';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [buttonText, setButtonText] = useState('Send magic link');
  const requestInProgress = useRef(false);

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email address.');
      return;
    }

    if (requestInProgress.current) return; // prevent double submission

    requestInProgress.current = true;
    setLoading(true);
    setButtonText('Sending...');
    setMessage('');

    // Use environment variable for redirect base, fallback to current origin
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirectTo = `${baseUrl}/auth/callback`;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo }
      });

      if (error) {
        setMessage(error.message);
        setButtonText('Send magic link');
      } else {
        setMessage('✨ Magic link sent! Check your email.');
        setButtonText('Link sent!');
        setTimeout(() => {
          setButtonText('Send magic link');
        }, 3000);
      }
    } catch (err: any) {
      setMessage('Network error. Please check your connection and try again.');
      setButtonText('Send magic link');
    } finally {
      setLoading(false);
      requestInProgress.current = false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
      <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to continue</p>
        </div>
        <input
          type="email"
          placeholder="your@email.com"
          className="w-full p-3 border border-gray-400 text-gray-400 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <button
          onClick={handleMagicLink}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {buttonText}
        </button>
        {message && <p className="mt-4 text-sm text-center text-gray-600">{message}</p>}
        <p className="mt-6 text-center text-xs text-gray-400">
          New to Accordiax? <Link href="/how-it-works" className="text-blue-600">Learn more</Link>
        </p>
      </div>
    </div>
  );
}