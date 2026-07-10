'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast, ToastContainer } from '@/components/ui/Toast';

interface Agreement {
  id: string;
  request_id: string;
  consultant_id: string;
  consultant_name: string;
  scope: string;
  price: number;
  timeline: string;
  deliverables: string;
  status: string;
  created_at: string;
  delivered_at?: string;
  dispute_reason?: string;
  dispute_details?: string;
  dispute_raised_at?: string;
  appeal_reason?: string;
  appeal_details?: string;
  appeal_raised_at?: string;
  found_guilty?: boolean | null;
  resolution_notes?: string;
  proposed_price?: number;
  price_proposed_by?: string;
  rating?: number;
  rating_given?: boolean;
  requests?: {
    id: string;
    title: string;
    description: string;
    student_id: string;
    budget_range?: string;
    category: string;
  };
  consultant?: {
    full_name: string;
  };
}

export default function AgreementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'student' | 'consultant' | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { toasts, toast, dismiss } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { router.push('/login'); return; }
      setCurrentUserId(user.id);

      const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
      if (!profile?.role) { router.push('/role-selection'); return; }
      setCurrentUserRole(profile.role);

      const { data, error } = await supabase
        .from('agreements')
        .select(`
          *,
          requests ( id, title, description, student_id, budget_range, category ),
          consultant:profiles!fk_agreements_consultant_profiles ( full_name )
        `)
        .eq('id', params.id)
        .single();

      if (error || !data) { setLoading(false); return; }

      const isStudent = data.requests?.student_id === user.id;
      const isConsultant = data.consultant_id === user.id;
      const isAdmin = profile.role === 'admin';

      if (!isStudent && !isConsultant && !isAdmin) { setUnauthorized(true); setLoading(false); return; }

      setAgreement(data as Agreement);

      if (data.requests?.student_id) {
        const { data: studentProfile } = await supabase.from('profiles').select('full_name').eq('id', data.requests.student_id).single();
        setStudentName(studentProfile?.full_name || 'Student');
      }

      const { data: msgs } = await supabase
        .from('agreement_messages')
        .select('*, sender:sender_id ( full_name )')
        .eq('agreement_id', params.id)
        .order('created_at', { ascending: true });
      setChatMessages(msgs || []);

      setLoading(false);
    };
    load();
  }, [params.id, router]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !agreement) return;
    setSendingMessage(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast('You must be logged in', 'error'); setSendingMessage(false); return; }
    const { error } = await supabase.from('agreement_messages').insert({
      agreement_id: agreement.id,
      sender_id: user.id,
      message: newMessage.trim(),
    });
    if (error) { toast('Failed to send: ' + error.message, 'error'); }
    else {
      setNewMessage('');
      const { data: refreshed } = await supabase
        .from('agreement_messages')
        .select('*, sender:sender_id ( full_name )')
        .eq('agreement_id', agreement.id)
        .order('created_at', { ascending: true });
      setChatMessages(refreshed || []);
    }
    setSendingMessage(false);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const dashboardPath = currentUserRole === 'consultant' ? '/consultant-dashboard' : '/student-dashboard';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="space-y-3 w-full max-w-xl px-6">
          <div className="h-6 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-40 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
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
        <p className="text-sm text-slate-500 text-center max-w-xs">You are not a party to this agreement and cannot view its details.</p>
        <Link href={dashboardPath} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">Go to dashboard</Link>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-lg font-bold text-slate-800">Agreement not found</h1>
        <Link href={dashboardPath} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Go to dashboard</Link>
      </div>
    );
  }

  const isStudent = agreement.requests?.student_id === currentUserId;
  const isConsultant = agreement.consultant_id === currentUserId;

  const statusGradient: Record<string, string> = {
    pending: 'from-amber-500 to-amber-600',
    accepted: 'from-emerald-500 to-teal-600',
    paid: 'from-teal-500 to-cyan-600',
    delivered: 'from-blue-500 to-indigo-600',
    disputed: 'from-rose-500 to-red-600',
    appealed: 'from-orange-500 to-amber-600',
    rejected: 'from-slate-400 to-slate-500',
    completed: 'from-emerald-600 to-green-700',
  };

  const gradient = statusGradient[agreement.status] ?? 'from-indigo-500 to-purple-600';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 h-14 flex items-center px-4 sm:px-6 gap-3">
        <Link href={dashboardPath} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>
        <span className="text-slate-300 select-none">/</span>
        <span className="text-sm text-slate-500 truncate">Agreement details</span>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

        {/* Status hero */}
        <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 sm:p-6 text-white`}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Agreement</p>
              <h1 className="text-lg sm:text-xl font-bold text-white leading-snug break-words">
                {agreement.requests?.title || 'Untitled Request'}
              </h1>
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/20 shrink-0`}>
              {agreement.status.charAt(0).toUpperCase() + agreement.status.slice(1)}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/10">
              <p className="text-white/60 text-xs mb-0.5">Price</p>
              <p className="text-white font-bold text-sm tabular-nums">
                {agreement.proposed_price
                  ? <><s className="opacity-50">N{agreement.price.toLocaleString()}</s> N{agreement.proposed_price.toLocaleString()}</>
                  : `N${agreement.price.toLocaleString()}`
                }
              </p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/10">
              <p className="text-white/60 text-xs mb-0.5">Timeline</p>
              <p className="text-white font-semibold text-sm">{agreement.timeline}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/10">
              <p className="text-white/60 text-xs mb-0.5">Created</p>
              <p className="text-white font-semibold text-xs">{new Date(agreement.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Parties</h2>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs shrink-0">
                {(studentName || 'S').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-slate-400">Student</p>
                <p className="text-sm font-semibold text-slate-800">{studentName || 'Student'}</p>
              </div>
              {isStudent && <span className="ml-auto text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">You</span>}
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-xs shrink-0">
                {(agreement.consultant?.full_name || agreement.consultant_name || 'C').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-slate-400">Consultant</p>
                <p className="text-sm font-semibold text-slate-800">{agreement.consultant?.full_name || agreement.consultant_name}</p>
              </div>
              {isConsultant && <span className="ml-auto text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">You</span>}
            </div>
          </div>
        </div>

        {/* Agreement terms */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agreement terms</h2>
          </div>
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xs font-medium text-slate-400 w-28 shrink-0 pt-0.5">Scope</span>
              <span className="text-sm text-slate-700 break-words leading-relaxed">{agreement.scope}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs font-medium text-slate-400 w-28 shrink-0 pt-0.5">Deliverables</span>
              <span className="text-sm text-slate-700 break-words leading-relaxed">{agreement.deliverables}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-400 w-28 shrink-0">Price</span>
              <span className="text-sm font-bold text-slate-900 tabular-nums">N{agreement.price.toLocaleString()}</span>
              {agreement.proposed_price && (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Proposed: N{agreement.proposed_price.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-400 w-28 shrink-0">Timeline</span>
              <span className="text-sm text-slate-700">{agreement.timeline}</span>
            </div>
            {agreement.delivered_at && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-400 w-28 shrink-0">Delivered on</span>
                <span className="text-sm text-slate-700">{formatDate(agreement.delivered_at)}</span>
              </div>
            )}
            {agreement.rating && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-400 w-28 shrink-0">Rating</span>
                <span className="text-sm font-semibold text-amber-600">{'★'.repeat(agreement.rating)}{'☆'.repeat(5 - agreement.rating)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Original request */}
        {agreement.requests && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Original request</h2>
            </div>
            <div className="px-4 py-4 space-y-2.5">
              <div className="flex items-start gap-3">
                <span className="text-xs font-medium text-slate-400 w-28 shrink-0 pt-0.5">Title</span>
                <span className="text-sm font-semibold text-slate-800 break-words">{agreement.requests.title}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xs font-medium text-slate-400 w-28 shrink-0 pt-0.5">Description</span>
                <span className="text-sm text-slate-700 break-words leading-relaxed">{agreement.requests.description}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-400 w-28 shrink-0">Category</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{agreement.requests.category?.replace(/_/g, ' ')}</span>
              </div>
              {agreement.requests.budget_range && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-400 w-28 shrink-0">Budget range</span>
                  <span className="text-sm text-slate-700">{agreement.requests.budget_range}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dispute / appeal info */}
        {(agreement.dispute_reason || agreement.appeal_reason) && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {agreement.dispute_reason && (
              <>
                <div className="px-4 py-3 border-b border-slate-100 bg-rose-50">
                  <h2 className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Dispute</h2>
                </div>
                <div className="px-4 py-4 space-y-2.5">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-medium text-slate-400 w-28 shrink-0 pt-0.5">Reason</span>
                    <span className="text-sm font-semibold text-rose-700 break-words">{agreement.dispute_reason}</span>
                  </div>
                  {agreement.dispute_details && (
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-medium text-slate-400 w-28 shrink-0 pt-0.5">Details</span>
                      <span className="text-sm text-slate-700 break-words leading-relaxed">{agreement.dispute_details}</span>
                    </div>
                  )}
                  {agreement.dispute_raised_at && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-400 w-28 shrink-0">Raised on</span>
                      <span className="text-sm text-slate-500">{formatDate(agreement.dispute_raised_at)}</span>
                    </div>
                  )}
                  {agreement.found_guilty !== null && agreement.found_guilty !== undefined && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-400 w-28 shrink-0">Outcome</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${agreement.found_guilty ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {agreement.found_guilty ? 'Ruled against consultant' : 'Ruled in favour of consultant'}
                      </span>
                    </div>
                  )}
                  {agreement.resolution_notes && (
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-medium text-slate-400 w-28 shrink-0 pt-0.5">Admin notes</span>
                      <span className="text-sm text-slate-700 break-words leading-relaxed">{agreement.resolution_notes}</span>
                    </div>
                  )}
                </div>
              </>
            )}
            {agreement.appeal_reason && (
              <>
                <div className="px-4 py-3 border-t border-slate-100 bg-orange-50">
                  <h2 className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Appeal</h2>
                </div>
                <div className="px-4 py-4 space-y-2.5">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-medium text-slate-400 w-28 shrink-0 pt-0.5">Reason</span>
                    <span className="text-sm font-semibold text-orange-700 break-words">{agreement.appeal_reason}</span>
                  </div>
                  {agreement.appeal_details && (
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-medium text-slate-400 w-28 shrink-0 pt-0.5">Details</span>
                      <span className="text-sm text-slate-700 break-words leading-relaxed">{agreement.appeal_details}</span>
                    </div>
                  )}
                  {agreement.appeal_raised_at && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-400 w-28 shrink-0">Raised on</span>
                      <span className="text-sm text-slate-500">{formatDate(agreement.appeal_raised_at)}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Dashboard CTA */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-indigo-800">Need to take action?</p>
            <p className="text-xs text-indigo-600 mt-0.5">Payments, approvals, disputes, and ratings are handled from your dashboard.</p>
          </div>
          <Link href={dashboardPath}>
            <Button variant="primary" size="sm">Go to dashboard</Button>
          </Link>
        </div>

        {/* Chat */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Messages
              {chatMessages.length > 0 && <span className="ml-2 text-slate-400 font-normal normal-case">{chatMessages.length} message{chatMessages.length !== 1 ? 's' : ''}</span>}
            </h2>
          </div>
          <div ref={chatContainerRef} className="h-72 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
            {chatMessages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-slate-400">No messages yet. Start the conversation.</p>
              </div>
            )}
            {chatMessages.map((msg) => {
              const isOwn = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  {!isOwn && (
                    <span className="text-xs font-semibold text-slate-500 mb-1 ml-1">{msg.sender?.full_name || 'Unknown'}</span>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${isOwn ? 'bg-indigo-500 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                    <p className="text-sm break-words">{msg.message}</p>
                    <span className={`text-xs block text-right mt-1 ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-slate-100 flex gap-2 items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage} loading={sendingMessage} size="sm">Send</Button>
          </div>
        </div>

      </main>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
