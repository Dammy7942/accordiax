'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RatingRecord {
  id: string;
  rating: number;
  consultant_id: string;
  consultant_name: string | null;
  created_at: string;
  requests: { title: string; student_id: string } | null;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-amber-400' : 'text-slate-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1.5 text-sm font-semibold text-slate-700">{rating}/5</span>
    </div>
  );
}

export default function RatingsPage() {
  const router = useRouter();
  const [received, setReceived] = useState<RatingRecord[]>([]);
  const [gave, setGave] = useState<RatingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRatings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const [{ data: profile }, { data, error }] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', user.id).single(),
        supabase
          .from('agreements')
          .select('id, rating, consultant_id, consultant_name, created_at, requests(title, student_id)')
          .not('rating', 'is', null)
          .order('created_at', { ascending: false }),
      ]);

      setRole(profile?.role ?? null);

      if (error || !data) {
        setLoading(false);
        return;
      }

      const all = data as unknown as RatingRecord[];
      setReceived(all.filter((r) => r.consultant_id === user.id));
      setGave(all.filter((r) => r.requests?.student_id === user.id));
      setLoading(false);
    };
    fetchRatings();
  }, [router]);

  const dashboardPath = role === 'consultant' ? '/consultant-dashboard' : '/student-dashboard';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading ratings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link
            href={dashboardPath}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-semibold text-slate-800">Ratings</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* Ratings you received */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Ratings you received</h2>
          <p className="text-sm text-slate-500 mb-5">Ratings students have left for your work as a consultant.</p>
          {received.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
              <p className="text-slate-400 text-sm">No ratings received yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {received.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <p className="font-semibold text-slate-800 text-sm mb-2">{r.requests?.title || 'Untitled request'}</p>
                  <StarRating rating={r.rating} />
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Ratings you gave */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Ratings you gave</h2>
          <p className="text-sm text-slate-500 mb-5">Ratings you left for consultants on completed agreements.</p>
          {gave.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
              <p className="text-slate-400 text-sm">You have not rated any consultant yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {gave.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="font-semibold text-slate-800 text-sm">{r.requests?.title || 'Untitled request'}</p>
                    {r.consultant_name && (
                      <span className="shrink-0 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-0.5">
                        {r.consultant_name}
                      </span>
                    )}
                  </div>
                  <StarRating rating={r.rating} />
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
