'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

interface Report {
  id: string;
  reported_user_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  agreement_id: string | null;
  evidence_url: string | null;
  created_at: string;
}

export default function ReportsAdmin() {
  const [reports, setReports] = useState<Report[]>([]);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReports(data);

      const userIds = [
        ...new Set(
          data.flatMap((r: Report) => [r.reported_user_id, r.reporter_id]).filter(Boolean)
        ),
      ];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        setNameMap(
          Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name ?? 'Unknown user']))
        );
      }
    }
    setLoading(false);
  };

  const resolve = async (id: string, action: 'dismiss' | 'block') => {
    setActing(id + '-' + action);
    const { error } = await supabase
      .from('reports')
      .update({ status: 'reviewed' })
      .eq('id', id);

    if (error) {
      alert(error.message);
    } else {
      if (action === 'block') {
        const report = reports.find((r) => r.id === id);
        if (report) {
          await supabase
            .from('profiles')
            .update({ blocked: true })
            .eq('id', report.reported_user_id);
        }
      }
      loadReports();
    }
    setActing(null);
  };

  const viewEvidence = async (evidenceUrl: string) => {
    const { data } = await supabase.storage
      .from('report_evidence')
      .createSignedUrl(evidenceUrl, 60 * 10);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-400 text-sm">Loading reports...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Pending Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          User reports awaiting review. Dismissing marks the report as reviewed. Blocking also flags the reported user.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
          <p className="text-slate-400 text-sm">No pending reports.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Reported user</p>
                    <p className="font-semibold text-slate-900 text-sm">
                      {nameMap[r.reported_user_id] || r.reported_user_id}
                    </p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Reported by</p>
                    <p className="text-sm text-slate-600">
                      {nameMap[r.reporter_id] || r.reporter_id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Reason</p>
                  <p className="text-sm text-slate-700">{r.reason}</p>
                </div>
                {r.details && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Details</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{r.details}</p>
                  </div>
                )}
                <div className="flex items-center gap-4 flex-wrap">
                  {r.agreement_id && (
                    <a
                      href={`/agreement/${r.agreement_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
                    >
                      View agreement
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  {r.evidence_url && (
                    <button
                      onClick={() => viewEvidence(r.evidence_url!)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View evidence
                    </button>
                  )}
                  <p className="text-xs text-slate-400 ml-auto">
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-5 flex gap-3">
                <button
                  onClick={() => resolve(r.id, 'dismiss')}
                  disabled={acting !== null}
                  className="bg-slate-500 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                >
                  {acting === r.id + '-dismiss' ? 'Dismissing...' : 'Dismiss'}
                </button>
                <button
                  onClick={() => resolve(r.id, 'block')}
                  disabled={acting !== null}
                  className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                >
                  {acting === r.id + '-block' ? 'Blocking...' : 'Block user'}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
