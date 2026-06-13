// app/admin/page.tsx
'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [appealedAgreements, setAppealedAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [secret, setSecret] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loadingConsultants, setLoadingConsultants] = useState(false);

  const checkAuth = () => {
    if (secret === process.env.NEXT_PUBLIC_ADMIN_SECRET) setAuthenticated(true);
  };

  useEffect(() => {
    if (authenticated) {
      loadAppealed();
      loadConsultants();
    }
  }, [authenticated]);

  const loadConsultants = async () => {
    setLoadingConsultants(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, verified')
      .eq('role', 'consultant');
    if (!error) setConsultants(data ?? []);
    setLoadingConsultants(false);
  };

  const toggleVerification = async (consultantId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ verified: !currentStatus })
      .eq('id', consultantId);
    if (error) alert(error.message);
    else loadConsultants();
  };

  const loadAppealed = async () => {
    try {
      const res = await fetch('/api/admin/appeals');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setAppealedAgreements(data);
      } else {
        console.error('API error:', data.error);
        setAppealedAgreements([]);
        alert('Failed to load appeals: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      setAppealedAgreements([]);
    } finally {
      setLoading(false);
    }
  };

  const resolveAppeal = async (agreementId: string, guilty: boolean, notes: string) => {
    try {
      const res = await fetch('/api/admin/resolve-appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreementId, guilty, notes }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Appeal resolved');
        loadAppealed();
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Network error');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
        <input
          type="password"
          placeholder="Enter admin secret"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="border p-2 rounded"
        />
        <button onClick={checkAuth} className="ml-2 bg-blue-600 text-white p-2 rounded">Login</button>
      </div>
    );
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Appealed Agreements</h1>
      {Array.isArray(appealedAgreements) && appealedAgreements.length === 0 ? (
        <p>No pending appeals.</p>
      ) : (
        <div className="space-y-6">
          {Array.isArray(appealedAgreements) && appealedAgreements.map((ag) => (
            <div key={ag.id} className="border p-4 rounded shadow">
              <p><strong>Request:</strong> {ag.requests?.title}</p>
              <p><strong>Consultant:</strong> {ag.consultant?.full_name || 'Unknown'}{ag.consultant?.email && ag.consultant.email !== 'Unknown' ? ` (${ag.consultant.email})` : ''}</p>
              <a href={`/agreement/${ag.id}`} target="_blank" className="text-blue-600 underline text-sm">View Full Agreement</a>
              <p><strong>Dispute Reason:</strong> {ag.dispute_reason}</p>
              <p><strong>Dispute Details:</strong> {ag.dispute_details}</p>
              <p><strong>Appeal Reason:</strong> {ag.appeal_reason}</p>
              <p><strong>Appeal Details:</strong> {ag.appeal_details}</p>
              <textarea
                id={`notes-${ag.id}`}
                placeholder="Resolution notes"
                className="w-full border p-2 rounded mt-2"
                rows={2}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    const notes = (document.getElementById(`notes-${ag.id}`) as HTMLTextAreaElement).value;
                    resolveAppeal(ag.id, true, notes);
                  }}
                  className="bg-red-600 text-white px-4 py-1 rounded"
                >
                  Found Guilty
                </button>
                <button
                  onClick={() => {
                    const notes = (document.getElementById(`notes-${ag.id}`) as HTMLTextAreaElement).value;
                    resolveAppeal(ag.id, false, notes);
                  }}
                  className="bg-green-600 text-white px-4 py-1 rounded"
                >
                  Not Guilty
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Consultant Verification</h2>
        {loadingConsultants ? (
          <p>Loading consultants...</p>
        ) : consultants.length === 0 ? (
          <p>No consultants found.</p>
        ) : (
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2 border">Name</th>
                <th className="text-left p-2 border">Email</th>
                <th className="text-left p-2 border">Status</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {consultants.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2 border">{c.full_name || '—'}</td>
                  <td className="p-2 border">{c.email || '—'}</td>
                  <td className="p-2 border">
                    <span className={c.verified ? 'text-green-600 font-medium' : 'text-gray-400'}>
                      {c.verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="p-2 border text-center">
                    <button
                      onClick={() => toggleVerification(c.id, c.verified)}
                      className={`px-3 py-1 rounded text-white text-xs ${c.verified ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {c.verified ? 'Unverify' : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}