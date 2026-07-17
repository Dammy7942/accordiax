'use client';
import { useEffect, useState } from 'react';

interface PayoutRequest {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  admin_notes: string | null;
  requested_at: string;
  processed_at: string | null;
  agreement: { id: string; requests: { title: string } | null } | null;
  consultant: { id: string; full_name: string | null; email: string | null } | null;
  bank_account: { bank_name: string; account_number: string; account_name: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  paid:     'bg-emerald-100 text-emerald-800',
};

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminPayoutsPage() {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'paid'>('pending');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payouts');
      const data = await res.json();
      setRequests(res.ok && Array.isArray(data) ? data : []);
    } catch { setRequests([]); }
    finally { setLoading(false); }
  };

  const update = async (id: string, status: string) => {
    setActing(id + '-' + status);
    try {
      await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, admin_notes: notes[id] ?? null }),
      });
      await load();
    } finally { setActing(null); }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    paid: requests.filter(r => r.status === 'paid').length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Payment Requests</h1>
        <p className="text-sm text-slate-500 mt-1">Review and process consultant payout requests.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {(['pending', 'approved', 'paid', 'rejected', 'all'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === tab
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {tab} {counts[tab] > 0 && <span className="ml-1 opacity-70">({counts[tab]})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm">No {filter === 'all' ? '' : filter} payment requests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">

              {/* Header row */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {req.consultant?.full_name ?? 'Unknown consultant'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{req.consultant?.email}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {req.agreement?.requests?.title ?? 'Agreement'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-extrabold text-slate-900 tabular-nums">
                    ₦{req.amount.toLocaleString()}
                  </p>
                  <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[req.status]}`}>
                    {req.status}
                  </span>
                </div>
              </div>

              {/* Bank details */}
              {req.bank_account && (
                <div className="bg-slate-50 rounded-xl p-4 grid sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Bank</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{req.bank_account.bank_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Account Number</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5 tabular-nums">{req.bank_account.account_number}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Account Name</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{req.bank_account.account_name}</p>
                  </div>
                </div>
              )}

              {/* Dates */}
              <p className="text-xs text-slate-400">
                Requested {fmt(req.requested_at)}
                {req.processed_at && ` · Processed ${fmt(req.processed_at)}`}
              </p>

              {/* Existing admin notes */}
              {req.admin_notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <p className="text-xs text-amber-800"><span className="font-semibold">Admin note:</span> {req.admin_notes}</p>
                </div>
              )}

              {/* Actions */}
              {req.status === 'pending' && (
                <div className="space-y-3 pt-1">
                  <textarea
                    rows={2}
                    placeholder="Optional note (shown to consultant on rejection)"
                    value={notes[req.id] ?? ''}
                    onChange={e => setNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => update(req.id, 'approved')}
                      disabled={acting !== null}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                      {acting === req.id + '-approved' ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => update(req.id, 'rejected')}
                      disabled={acting !== null}
                      className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                      {acting === req.id + '-rejected' ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
              )}

              {req.status === 'approved' && (
                <div className="pt-1">
                  <p className="text-xs text-slate-500 mb-2">Transfer the funds manually to the account above, then mark as paid.</p>
                  <button
                    onClick={() => update(req.id, 'paid')}
                    disabled={acting !== null}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {acting === req.id + '-paid' ? 'Saving...' : 'Mark as Paid'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
