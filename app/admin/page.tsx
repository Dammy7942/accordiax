'use client';
import { useEffect, useState } from 'react';

interface Appeal {
  id: string;
  dispute_reason: string | null;
  dispute_details: string | null;
  appeal_reason: string | null;
  appeal_details: string | null;
  requests: { title: string } | null;
  consultant: { full_name: string | null; email: string | null } | null;
}

export default function AdminPage() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState<{ id: string; guilty: boolean } | null>(null);

  useEffect(() => { loadAppeals(); }, []);

  const loadAppeals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/appeals');
      const data = await res.json();
      setAppeals(res.ok && Array.isArray(data) ? data : []);
    } catch {
      setAppeals([]);
    } finally {
      setLoading(false);
    }
  };

  const resolveAppeal = async (agreementId: string, guilty: boolean) => {
    setResolving({ id: agreementId, guilty });
    try {
      const res = await fetch('/api/admin/resolve-appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementId,
          guilty,
          notes: resolutionNotes[agreementId] ?? '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResolutionNotes((prev) => {
          const next = { ...prev };
          delete next[agreementId];
          return next;
        });
        loadAppeals();
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch {
      alert('Network error');
    } finally {
      setResolving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-400 text-sm">Loading appeals...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Appealed Agreements</h1>
        <p className="text-sm text-slate-500 mt-1">
          Disputes that have been appealed and require a final ruling.
        </p>
      </div>

      {appeals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
          <p className="text-slate-400 text-sm">No pending appeals.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {appeals.map((ag) => (
            <div key={ag.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

              {/* Card header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                <p className="font-semibold text-slate-900 text-sm">
                  {ag.requests?.title || 'Untitled request'}
                </p>
                <a
                  href={`/agreement/${ag.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
                >
                  View agreement
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              {/* Card body */}
              <div className="px-6 py-5 grid sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Consultant</p>
                    <p className="text-sm text-slate-700">
                      {ag.consultant?.full_name || 'Unknown'}
                      {ag.consultant?.email ? ` (${ag.consultant.email})` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Dispute reason</p>
                    <p className="text-sm text-slate-700">{ag.dispute_reason || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Dispute details</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{ag.dispute_details || 'Not provided'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Appeal reason</p>
                    <p className="text-sm text-slate-700">{ag.appeal_reason || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Appeal details</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{ag.appeal_details || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Resolution */}
              <div className="px-6 pb-6 border-t border-slate-50 pt-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Resolution notes</p>
                <textarea
                  placeholder="Enter your resolution notes before ruling..."
                  value={resolutionNotes[ag.id] ?? ''}
                  onChange={(e) =>
                    setResolutionNotes((prev) => ({ ...prev, [ag.id]: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition mb-4"
                  rows={3}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => resolveAppeal(ag.id, true)}
                    disabled={resolving !== null}
                    className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
                  >
                    {resolving?.id === ag.id && resolving.guilty ? 'Resolving...' : 'Found guilty'}
                  </button>
                  <button
                    onClick={() => resolveAppeal(ag.id, false)}
                    disabled={resolving !== null}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
                  >
                    {resolving?.id === ag.id && !resolving.guilty ? 'Resolving...' : 'Not guilty'}
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
