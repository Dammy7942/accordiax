'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

interface EscrowAgreement {
  id: string;
  consultant_id: string;
  price: number | null;
  paystack_ref: string | null;
  requests: { title: string } | null;
}

export default function EscrowAdminPage() {
  const [agreements, setAgreements] = useState<EscrowAgreement[]>([]);
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState<string | null>(null);

  const loadCompleted = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/escrow');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAgreements(data);

        const ids = [...new Set(data.map((ag: EscrowAgreement) => ag.consultant_id).filter(Boolean))];
        if (ids.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', ids);
          setProfileNames(
            Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name ?? '']))
          );
        }
      }
    } catch (err) {
      console.error('Failed to load escrow data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCompleted(); }, []);

  const releasePayment = async (agreementId: string) => {
    setReleasing(agreementId);
    try {
      const res = await fetch('/api/paystack/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreementId }),
      });
      const data = await res.json();
      if (data.success) {
        loadCompleted();
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch {
      alert('Network error');
    } finally {
      setReleasing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-400 text-sm">Loading escrow data...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Escrow Releases</h1>
        <p className="text-sm text-slate-500 mt-1">
          Agreements approved by students and awaiting payment release to consultants.
        </p>
      </div>

      {agreements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
          <p className="text-slate-400 text-sm">No pending releases.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {agreements.map((ag) => {
            const consultantName = profileNames[ag.consultant_id];
            return (
              <div key={ag.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <p className="font-semibold text-slate-900 text-sm">
                      {ag.requests?.title || 'Untitled request'}
                    </p>
                    <p className="text-sm text-slate-600">
                      Consultant:{' '}
                      <span className="font-medium">
                        {consultantName || ag.consultant_id}
                      </span>
                    </p>
                    <p className="text-sm text-slate-600">
                      Amount:{' '}
                      <span className="font-semibold text-slate-800">
                        NGN {ag.price?.toLocaleString() ?? 'N/A'}
                      </span>
                    </p>
                    {ag.paystack_ref && (
                      <p className="text-xs text-slate-400 font-mono">
                        Ref: {ag.paystack_ref}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => releasePayment(ag.id)}
                    disabled={releasing !== null}
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
                  >
                    {releasing === ag.id ? 'Releasing...' : 'Release payment'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
