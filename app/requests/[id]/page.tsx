'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast, ToastContainer } from '@/components/ui/Toast';

interface RequestDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_range: string | null;
  status: string;
  created_at: string;
  student_id: string;
  profiles?: { full_name: string | null };
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'student' | 'consultant' | 'admin' | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [alreadyOffered, setAlreadyOffered] = useState(false);

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerForm, setOfferForm] = useState({ scope: '', price: '', timeline: '', deliverables: '' });
  const [submitting, setSubmitting] = useState(false);
  const [offerError, setOfferError] = useState('');

  const { toasts, toast, dismiss } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { router.push('/login'); return; }
      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile?.role) { router.push('/role-selection'); return; }
      setCurrentUserRole(profile.role);

      const { data, error } = await supabase
        .from('requests')
        .select('*, profiles!requests_student_id_fkey ( full_name )')
        .eq('id', params.id)
        .single();

      if (error || !data) { setLoading(false); return; }

      const isOwner = data.student_id === user.id;
      const isConsultant = profile.role === 'consultant';
      const isAdmin = profile.role === 'admin';

      if (!isOwner && !isConsultant && !isAdmin) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      setRequest(data as RequestDetail);

      if (isConsultant) {
        const { data: existing } = await supabase
          .from('agreements')
          .select('id')
          .eq('request_id', params.id)
          .eq('consultant_id', user.id)
          .maybeSingle();
        setAlreadyOffered(!!existing);
      }

      setLoading(false);
    };
    load();
  }, [params.id, router]);

  const handleOfferChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setOfferForm({ ...offerForm, [e.target.name]: e.target.value });
  };

  const submitOffer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!request) return;
    setSubmitting(true);
    setOfferError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setOfferError('You must be logged in'); setSubmitting(false); return; }

    const { data: profileData } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    const consultantName = profileData?.full_name || 'Unknown Consultant';

    const priceNum = parseInt(offerForm.price, 10);
    if (isNaN(priceNum) || priceNum <= 0) { setOfferError('Please enter a valid price'); setSubmitting(false); return; }

    const { error } = await supabase.from('agreements').insert({
      request_id: request.id,
      consultant_id: user.id,
      consultant_name: consultantName,
      scope: offerForm.scope,
      price: priceNum,
      timeline: offerForm.timeline,
      deliverables: offerForm.deliverables,
      status: 'pending',
    });

    if (error) {
      setOfferError(error.message);
    } else {
      toast('Offer sent to the student!', 'success');
      setAlreadyOffered(true);
      setShowOfferModal(false);
      setOfferForm({ scope: '', price: '', timeline: '', deliverables: '' });
    }
    setSubmitting(false);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const dashboardPath = currentUserRole === 'consultant' ? '/consultant-dashboard' : '/student-dashboard';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="space-y-3 w-full max-w-xl px-6">
          <div className="h-6 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-slate-800">Access denied</h1>
        <p className="text-sm text-slate-500 text-center max-w-xs">You do not have permission to view this request.</p>
        <Link href={dashboardPath} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">Go to dashboard</Link>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-lg font-bold text-slate-800">Request not found</h1>
        <Link href={dashboardPath} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Go to dashboard</Link>
      </div>
    );
  }

  const isOwner = request.student_id === currentUserId;
  const isConsultant = currentUserRole === 'consultant';
  const studentName = (request.profiles as any)?.full_name || 'Student';

  const statusGradient: Record<string, string> = {
    open: 'from-blue-500 to-indigo-600',
    matched: 'from-indigo-500 to-purple-600',
    closed: 'from-slate-400 to-slate-500',
  };
  const gradient = statusGradient[request.status] ?? 'from-indigo-500 to-purple-600';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 h-14 flex items-center px-4 sm:px-6 gap-3">
        <Link href={dashboardPath} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>
        <span className="text-slate-300 select-none">/</span>
        <span className="text-sm text-slate-500 truncate">Request details</span>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

        {/* Hero */}
        <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 sm:p-6 text-white`}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Request</p>
              <h1 className="text-lg sm:text-xl font-bold text-white leading-snug break-words">{request.title}</h1>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/20 shrink-0">
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/10">
              <p className="text-white/60 text-xs mb-0.5">Category</p>
              <p className="text-white font-semibold text-sm">{request.category.replace(/_/g, ' ')}</p>
            </div>
            {request.budget_range && (
              <div className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/10">
                <p className="text-white/60 text-xs mb-0.5">Budget range</p>
                <p className="text-white font-semibold text-sm">{request.budget_range}</p>
              </div>
            )}
            <div className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/10">
              <p className="text-white/60 text-xs mb-0.5">Posted</p>
              <p className="text-white font-semibold text-xs">{formatDate(request.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Posted by */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Posted by</h2>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs shrink-0">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{studentName}</p>
              <p className="text-xs text-slate-400">Student</p>
            </div>
            {isOwner && (
              <span className="ml-auto text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">You</span>
            )}
          </div>
        </div>

        {/* Full description */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</h2>
          </div>
          <div className="px-4 py-4">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{request.description}</p>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</h2>
          </div>
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-400 w-28 shrink-0">Category</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">{request.category.replace(/_/g, ' ')}</span>
            </div>
            {request.budget_range && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-400 w-28 shrink-0">Budget range</span>
                <span className="text-sm font-semibold text-slate-800">{request.budget_range}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-400 w-28 shrink-0">Status</span>
              <Badge status={request.status as any} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-400 w-28 shrink-0">Posted on</span>
              <span className="text-sm text-slate-600">{formatDate(request.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Consultant action */}
        {isConsultant && request.status === 'open' && (
          <div className={`rounded-2xl px-4 py-4 flex items-center justify-between gap-3 flex-wrap border ${alreadyOffered ? 'bg-emerald-50 border-emerald-100' : 'bg-violet-50 border-violet-100'}`}>
            <div>
              {alreadyOffered ? (
                <>
                  <p className="text-sm font-semibold text-emerald-800">Offer already sent</p>
                  <p className="text-xs text-emerald-600 mt-0.5">You have already submitted an offer for this request. Check your pending offers.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-violet-800">Interested in this request?</p>
                  <p className="text-xs text-violet-600 mt-0.5">Submit an offer and the student will be notified.</p>
                </>
              )}
            </div>
            {!alreadyOffered && (
              <Button variant="primary" size="sm" onClick={() => setShowOfferModal(true)}>Make offer</Button>
            )}
          </div>
        )}

        {/* Student: go to dashboard */}
        {isOwner && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-indigo-800">Manage this request</p>
              <p className="text-xs text-indigo-600 mt-0.5">View incoming offers and take action from your dashboard.</p>
            </div>
            <Link href="/student-dashboard">
              <Button variant="primary" size="sm">Go to dashboard</Button>
            </Link>
          </div>
        )}

      </main>

      {/* Offer modal */}
      <Modal isOpen={showOfferModal} onClose={() => setShowOfferModal(false)} title={`Make an offer for: ${request.title}`}>
        <form onSubmit={submitOffer} className="space-y-4">
          <textarea
            name="scope"
            placeholder="What will you do? (scope)"
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400"
            rows={2}
            value={offerForm.scope}
            onChange={handleOfferChange}
            required
          />
          <Input type="number" name="price" placeholder="Price (N)" value={offerForm.price} onChange={handleOfferChange} required />
          <Input name="timeline" placeholder="Timeline (e.g. 5 days)" value={offerForm.timeline} onChange={handleOfferChange} required />
          <textarea
            name="deliverables"
            placeholder="Deliverables"
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400"
            rows={2}
            value={offerForm.deliverables}
            onChange={handleOfferChange}
            required
          />
          {offerError && <p className="text-red-600 text-sm">{offerError}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setShowOfferModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={submitting}>Send offer</Button>
          </div>
        </form>
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
