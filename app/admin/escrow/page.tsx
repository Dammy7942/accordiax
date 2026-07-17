'use client';
import { useEffect, useState } from 'react';

interface EscrowAgreement {
  id: string;
  consultant_id: string;
  price: number | null;
  status: string;
  paystack_ref: string | null;
  requests: { title: string } | null;
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  paid_held:  { label: 'Payment held',     className: 'bg-amber-100 text-amber-800' },
  delivered:  { label: 'Awaiting approval', className: 'bg-blue-100 text-blue-800' },
  completed:  { label: 'Awaiting payout',  className: 'bg-indigo-100 text-indigo-800' },
};

export default function EscrowAdminPage() {
  const [agreements, setAgreements] = useState<EscrowAgreement[]>([]);
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/escrow');
        const data = await res.json();
        if (!Array.isArray(data)) { setLoading(false); return; }

        setAgreements(data);

        const ids = [...new Set(data.map((ag: EscrowAgreement) => ag.consultant_id).filter(Boolean))];
        if (ids.length > 0) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', ids);
          setProfileNames(Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p.full_name ?? ''])));
        }
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const total = agreements.reduce((sum, ag) => sum + (ag.price ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Funds in Escrow</h1>
        <p className="text-sm text-slate-500 mt-1">
          Read-only view of agreements where student payment is held. Use the Payouts tab to process consultant payments.
        </p>
      </div>

      {/* Summary strip */}
      {agreements.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Total held</p>
            <p className="text-xl font-extrabold text-slate-900 tabular-nums mt-1">₦{total.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Agreements</p>
            <p className="text-xl font-extrabold text-slate-900 tabular-nums mt-1">{agreements.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Awaiting payout</p>
            <p className="text-xl font-extrabold text-indigo-700 tabular-nums mt-1">
              {agreements.filter(a => a.status === 'completed').length}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">In review</p>
            <p className="text-xl font-extrabold text-blue-700 tabular-nums mt-1">
              {agreements.filter(a => a.status === 'delivered').length}
            </p>
          </div>
        </div>
      )}

      {agreements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
          <p className="text-slate-400 text-sm">No funds currently held in escrow.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agreements.map((ag) => {
            const statusMeta = STATUS_LABEL[ag.status] ?? { label: ag.status, className: 'bg-slate-100 text-slate-600' };
            return (
              <div key={ag.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {ag.requests?.title || 'Untitled request'}
                    </p>
                    <p className="text-sm text-slate-500">
                      Consultant:{' '}
                      <span className="font-medium text-slate-700">
                        {profileNames[ag.consultant_id] || ag.consultant_id}
                      </span>
                    </p>
                    {ag.paystack_ref && (
                      <p className="text-xs text-slate-400 font-mono">Ref: {ag.paystack_ref}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 space-y-2">
                    <p className="text-lg font-extrabold text-slate-900 tabular-nums">
                      ₦{ag.price?.toLocaleString() ?? 'N/A'}
                    </p>
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
