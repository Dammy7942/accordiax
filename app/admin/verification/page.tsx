'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

interface PendingProfile {
  id: string;
  full_name: string | null;
  id_photo_url: string | null;
  verification_status: string;
}

interface Consultant {
  id: string;
  full_name: string | null;
  email: string | null;
  verified: boolean;
}

export default function VerificationAdmin() {
  const [pending, setPending] = useState<PendingProfile[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loadingConsultants, setLoadingConsultants] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    loadPending();
    loadConsultants();
  }, []);

  const loadPending = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, id_photo_url, verification_status')
      .eq('verification_status', 'pending');
    if (!error) setPending(data ?? []);
    setLoadingPending(false);
  };

  const loadConsultants = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, verified')
      .eq('role', 'consultant');
    if (!error) setConsultants(data ?? []);
    setLoadingConsultants(false);
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

  const verifyIdentity = async (userId: string, approved: boolean) => {
    const key = userId + (approved ? '-approve' : '-reject');
    setActing(key);
    const status = approved ? 'verified' : 'rejected';
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: status })
      .eq('id', userId);
    if (error) alert(error.message);
    else loadPending();
    setActing(null);
  };

  const toggleConsultantVerified = async (consultantId: string, currentStatus: boolean) => {
    setActing(consultantId + '-toggle');
    const { error } = await supabase
      .from('profiles')
      .update({ verified: !currentStatus })
      .eq('id', consultantId);
    if (error) alert(error.message);
    else loadConsultants();
    setActing(null);
  };

  return (
    <div className="space-y-12">

      {/* Identity Verification */}
      <section>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Identity Verification</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review uploaded identity documents and approve or reject pending requests.
          </p>
        </div>

        {loadingPending ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-400 text-sm">Loading...</p>
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center shadow-sm">
            <p className="text-slate-400 text-sm">No pending identity verifications.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{p.full_name || 'Unnamed user'}</p>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">{p.id}</p>
                  {p.id_photo_url && (
                    <button
                      onClick={() => viewID(p.id_photo_url!)}
                      className="mt-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View ID document
                    </button>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => verifyIdentity(p.id, true)}
                    disabled={acting !== null}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors"
                  >
                    {acting === p.id + '-approve' ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => verifyIdentity(p.id, false)}
                    disabled={acting !== null}
                    className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors"
                  >
                    {acting === p.id + '-reject' ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Consultant Trust Status */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Consultant Trust Status</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manually toggle the verified badge displayed on consultant profiles.
          </p>
        </div>

        {loadingConsultants ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-400 text-sm">Loading...</p>
          </div>
        ) : consultants.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center shadow-sm">
            <p className="text-slate-400 text-sm">No consultants found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {consultants.map((c) => (
                  <tr key={c.id} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{c.full_name || 'Unnamed'}</td>
                    <td className="px-5 py-3 text-slate-500">{c.email || 'No email'}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          c.verified
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {c.verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => toggleConsultantVerified(c.id, c.verified)}
                        disabled={acting !== null}
                        className={`px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors disabled:opacity-50 ${
                          c.verified
                            ? 'bg-rose-500 hover:bg-rose-600'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {acting === c.id + '-toggle' ? '...' : c.verified ? 'Unverify' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}
