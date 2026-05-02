'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
      // Success – redirect
      router.push(role === 'student' ? '/student-dashboard' : '/consultant-dashboard');
    }
  };

  if (loading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-700 font-bold mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">I am a...</h1>
      <p className="text-gray-500 mb-8">Choose your role to continue</p>
      <div className="flex flex-col sm:flex-row gap-6">
        <button
          onClick={() => selectRole('student')}
          disabled={loading}
          className="bg-white hover:bg-green-50 border-2 border-green-200 p-8 rounded-2xl shadow-lg w-64 text-center transition transform hover:scale-105 disabled:opacity-50"
        >
          <div className="text-5xl mb-3">🎓</div>
          <div className="font-bold text-xl text-green-700">Student</div>
          <p className="text-gray-500 text-sm mt-2">Get help with projects, assignments, admissions</p>
        </button>
        <button
          onClick={() => selectRole('consultant')}
          disabled={loading}
          className="bg-white hover:bg-purple-50 border-2 border-purple-200 p-8 rounded-2xl shadow-lg w-64 text-center transition transform hover:scale-105 disabled:opacity-50"
        >
          <div className="text-5xl mb-3">👨‍🏫</div>
          <div className="font-bold text-xl text-purple-700">Consultant</div>
          <p className="text-gray-500 text-sm mt-2">Offer supervision, guidance, academic support</p>
        </button>
      </div>
    </div>
  );
}