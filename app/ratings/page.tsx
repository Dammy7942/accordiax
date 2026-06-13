'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RatingsPage() {
  const router = useRouter();
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('agreements')
        .select(`
          id,
          rating,
          consultant_id,
          consultant_name,
          status,
          created_at,
          requests ( title, student_id )
        `)
        .not('rating', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const filtered = (data || []).filter((ag: any) =>
        ag.consultant_id === user.id ||
        ag.requests?.student_id === user.id
      );

      setRatings(filtered);
      setLoading(false);
    };
    fetchRatings();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Your Ratings History</h1>
        <p className="text-gray-500 mb-6">Ratings you have given or received on completed agreements.</p>
        {ratings.length === 0 ? (
          <p>No ratings yet.</p>
        ) : (
          <div className="space-y-4">
            {ratings.map((r) => (
              <div key={r.id} className="bg-white p-4 rounded-lg shadow border">
                <p className="font-medium">{r.requests?.title || 'Untitled Request'}</p>
                <p className="text-sm text-gray-500">Rating: {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} ({r.rating}/5)</p>
                <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}