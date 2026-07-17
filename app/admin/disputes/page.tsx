'use client';
import { useEffect, useState } from 'react';

interface Dispute {
  id: string;
  dispute_reason: string | null;
  dispute_details: string | null;
  dispute_raised_at: string | null;
  dispute_raised_by: string | null;
  requests: { title: string; student_id: string } | null;
  consultant: { full_name: string | null; email: string | null } | null;
  student: { full_name: string | null; email: string | null } | null;
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState<{ id: string; ruledForStudent: boolean } | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/disputes');
      const data = await res.json();
      setDisputes(res.ok && Array.isArray(data) ? data : []);
    } catch {
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  const resolve = async (disputeId: string, ruledForStudent: boolean) => {
    setResolving({ id: disputeId, ruledForStudent });
    try {
      const res = await fetch('/api/admin/resolve-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementId: disputeId,
          ruledForStudent,
          notes: resolutionNotes[disputeId] ?? '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResolutionNotes(prev => { const next = { ...prev }; delete next[disputeId]; return next; });
        load();
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
        <p className="text-slate-400 text-sm">Loading disputes...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Active Disputes</h1>
        <p className="text-sm text-slate-500 mt-1">
          Agreements under dispute awaiting a ruling. The losing party may appeal after resolution.
        </p>
      </div>

      {disputes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
          <p className="text-slate-400 text-sm">No active disputes.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {disputes.map(dispute => {
            const raisedByStudent = dispute.dispute_raised_by !== null &&
              dispute.dispute_raised_by === dispute.requests?.student_id;

            return (
              <div key={dispute.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {dispute.requests?.title ?? 'Untitled request'}
                    </p>
                    {dispute.dispute_raised_at && (
                      <p className="text-xs text-slate-400 mt-0.5">Raised {fmt(dispute.dispute_raised_at)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${raisedByStudent ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                      Raised by {raisedByStudent ? 'student' : 'consultant'}
                    </span>
                    <a
                      href={`/agreement/${dispute.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
                    >
                      View agreement
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 grid sm:grid-cols-2 gap-6">
                  {/* Parties */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Student</p>
                      <p className="text-sm text-slate-700">
                        {dispute.student?.full_name ?? 'Unknown'}
                        {dispute.student?.email ? <span className="text-slate-400"> ({dispute.student.email})</span> : null}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Consultant</p>
                      <p className="text-sm text-slate-700">
                        {dispute.consultant?.full_name ?? 'Unknown'}
                        {dispute.consultant?.email ? <span className="text-slate-400"> ({dispute.consultant.email})</span> : null}
                      </p>
                    </div>
                  </div>

                  {/* Dispute details */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Dispute reason</p>
                      <p className="text-sm text-slate-700">{dispute.dispute_reason ?? 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Details</p>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{dispute.dispute_details ?? 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Resolution */}
                <div className="px-6 pb-6 border-t border-slate-50 pt-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Resolution notes</p>
                  <textarea
                    placeholder="Summarise your ruling before deciding. Both parties will receive this in their notification email."
                    value={resolutionNotes[dispute.id] ?? ''}
                    onChange={e => setResolutionNotes(prev => ({ ...prev, [dispute.id]: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition mb-4"
                    rows={3}
                  />
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => resolve(dispute.id, true)}
                      disabled={resolving !== null}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
                    >
                      {resolving?.id === dispute.id && resolving.ruledForStudent ? 'Resolving...' : 'Rule for Student'}
                    </button>
                    <button
                      onClick={() => resolve(dispute.id, false)}
                      disabled={resolving !== null}
                      className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
                    >
                      {resolving?.id === dispute.id && !resolving.ruledForStudent ? 'Resolving...' : 'Rule for Consultant'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-3">
                    Ruling for the student marks the agreement rejected and flags the consultant.
                    Ruling for the consultant marks the agreement complete and releases payment.
                    Either party may appeal the ruling.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
