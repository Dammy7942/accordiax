'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandedLoader } from '@/components/BrandedLoader';
import Link from 'next/link';

function StudentIcon() {
  return (
    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
  );
}

function ConsultantIcon() {
  return (
    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

export default function RoleSelection() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error('No user found, redirecting to login', error);
        router.push('/login');
      } else {
        setUserId(user.id);
        setLoading(false);
      }
    };
    getUser();
  }, [router]);

  const selectRole = async (role: 'student' | 'consultant') => {
    if (!userId) {
      setError('User not identified. Please log in again.');
      return;
    }

    setLoading(true);
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({ id: userId, role }, { onConflict: 'id' });

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      setError(upsertError.message);
      setLoading(false);
    } else {
      router.push('/profile-completion');
    }
  };

  if (loading && !error) {
    return <BrandedLoader message="Setting up your account..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
        <div className="bg-white border border-red-100 rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-slate-900 font-bold mb-2">Something went wrong</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">

      {/* Header */}
      <div className="text-center mb-10">
        <Link
          href="/"
          className="inline-block text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 tracking-tight"
        >
          Accordiax
        </Link>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-1.5 w-10 rounded-full bg-indigo-600" />
          <div className="h-1.5 w-10 rounded-full bg-indigo-600 ring-2 ring-indigo-200 ring-offset-1" />
          <div className="h-1.5 w-10 rounded-full bg-slate-200" />
        </div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Step 1 of 2</p>

        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Choose your role</h1>
        <p className="text-slate-500 text-sm">You can always contact support if you need to change this later.</p>
      </div>

      {/* Role cards */}
      <div className="flex flex-col sm:flex-row gap-5 w-full max-w-md">

        {/* Student */}
        <button
          onClick={() => selectRole('student')}
          disabled={loading}
          className="flex-1 bg-white border-2 border-slate-200 hover:border-indigo-300 p-7 rounded-2xl shadow-sm hover:shadow-lg text-center transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 group"
        >
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200 group-hover:scale-110 transition-all duration-300">
            <StudentIcon />
          </div>
          <div className="font-bold text-lg text-slate-900 mb-1.5">Student</div>
          <p className="text-slate-500 text-sm leading-relaxed mb-5">
            Post requests and get structured help with projects, assignments, and admissions.
          </p>
          <div className="w-full bg-indigo-600 group-hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl text-center transition-colors duration-200">
            Continue as student
          </div>
        </button>

        {/* Consultant */}
        <button
          onClick={() => selectRole('consultant')}
          disabled={loading}
          className="flex-1 bg-white border-2 border-slate-200 hover:border-purple-300 p-7 rounded-2xl shadow-sm hover:shadow-lg text-center transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 group"
        >
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 group-hover:scale-110 transition-all duration-300">
            <ConsultantIcon />
          </div>
          <div className="font-bold text-lg text-slate-900 mb-1.5">Consultant</div>
          <p className="text-slate-500 text-sm leading-relaxed mb-5">
            Offer your expertise and get paid for academic supervision, guidance, and support.
          </p>
          <div className="w-full bg-purple-600 group-hover:bg-purple-700 text-white text-sm font-semibold py-2.5 rounded-xl text-center transition-colors duration-200">
            Continue as consultant
          </div>
        </button>

      </div>
    </div>
  );
}
