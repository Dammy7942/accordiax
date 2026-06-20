'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function ReportsAdmin() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  const resolve = async (id: string, action: 'dismiss' | 'block') => {
    const { error } = await supabase
      .from('reports')
      .update({ status: 'reviewed' })
      .eq('id', id);
    if (error) alert(error.message);
    else {
      if (action === 'block') {
        const report = reports.find(r => r.id === id);
        if (report) {
          await supabase
            .from('profiles')
            .update({ blocked: true })
            .eq('id', report.reported_user_id);
        }
      }
      loadReports();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      {reports.length === 0 ? <p>No pending reports.</p> : reports.map((r) => (
        <div key={r.id} className="border p-4 rounded mb-4">
          <p><strong>Reported User ID:</strong> {r.reported_user_id}</p>
          <p><strong>Reporter User ID:</strong> {r.reporter_id}</p>
          <p><strong>Reason:</strong> {r.reason}</p>
          <p><strong>Details:</strong> {r.details}</p>
          {r.agreement_id && <p><strong>Agreement ID:</strong> {r.agreement_id}</p>}
          {r.evidence_url && (
            <button
              onClick={async () => {
                const { data } = await supabase.storage
                  .from('report_evidence')
                  .createSignedUrl(r.evidence_url, 60 * 10);
                if (data?.signedUrl) window.open(data.signedUrl, '_blank');
              }}
              className="text-blue-600 underline text-sm ml-2"
            >
              View Evidence
            </button>
          )}
          <div className="mt-2 flex gap-2">
            <button onClick={() => resolve(r.id, 'dismiss')} className="bg-gray-500 text-white px-4 py-1 rounded">Dismiss</button>
            <button onClick={() => resolve(r.id, 'block')} className="bg-red-600 text-white px-4 py-1 rounded">Block User</button>
          </div>
        </div>
      ))}
    </div>
  );
}