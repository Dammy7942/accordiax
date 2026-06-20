'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function VerificationAdmin() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPending(); }, []);

  const loadPending = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, id_photo_url, verification_status')
      .eq('verification_status', 'pending');
    if (error) {
      console.error(error);
    } else {
      setPending(data || []);
    }
    setLoading(false);
  };

  const viewID = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('identity_documents')
      .createSignedUrl(filePath, 60 * 10);
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    } else {
      alert('Could not generate preview');
    }
  };

  const verify = async (userId: string, approved: boolean) => {
    const status = approved ? 'verified' : 'rejected';
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: status })
      .eq('id', userId);
    if (error) alert(error.message);
    else loadPending();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Identity Verification</h1>
      {pending.length === 0 ? (
        <p>No pending verifications.</p>
      ) : (
        pending.map((p) => (
          <div key={p.id} className="border p-4 rounded mb-4">
            <p><strong>{p.full_name || p.id}</strong></p>
            <p className="text-sm text-gray-500">User ID: {p.id}</p>
            {p.id_photo_url && (
              <button onClick={() => viewID(p.id_photo_url)} className="text-blue-600 underline text-sm">
                View ID (secure preview)
              </button>
            )}
            <div className="mt-2 flex gap-2">
              <button onClick={() => verify(p.id, true)} className="bg-green-600 text-white px-4 py-1 rounded">Approve</button>
              <button onClick={() => verify(p.id, false)} className="bg-red-600 text-white px-4 py-1 rounded">Reject</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}