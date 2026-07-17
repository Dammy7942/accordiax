'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RoleSwitcher from '@/components/RoleSwitcher';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import ReportModal from '@/components/ReportModal';
import { Input } from '@/components/ui/Input';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast, ToastContainer } from '@/components/ui/Toast';

interface Request {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_range: string;
  student_id: string;
  student_name?: string;
  created_at: string;
}

interface Agreement {
  id: string;
  request_id: string;
  request_title?: string;
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
  appeal_reason?: string;
  appeal_details?: string;
  found_guilty?: boolean | null;
  proposed_price?: number;
  price_proposed_at?: string;
  price_proposed_by?: string;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
}

interface ProfileStats {
  full_name: string;
  total_agreements: number;
  completed_agreements: number;
  disputed_agreements: number;
  rejected_agreements: number;
  cancelled_agreements: number;
}

type TabType = 'overview' | 'open' | 'pending' | 'accepted' | 'paid' | 'delivered' | 'disputed' | 'rejected' | 'completed';

const ChatIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const RatingsStarIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const SignOutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default function ConsultantDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>('unverified');
  const [idPhotoPath, setIdPhotoPath] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportedUserId, setReportedUserId] = useState('');
  const [reportAgreementId, setReportAgreementId] = useState<string | undefined>();
  const [userRole, setUserRole] = useState<'student' | 'consultant' | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [openRequests, setOpenRequests] = useState<Request[]>([]);
  const [pendingOffers, setPendingOffers] = useState<Agreement[]>([]);
  const [acceptedOffers, setAcceptedOffers] = useState<Agreement[]>([]);
  const [paidOffers, setPaidOffers] = useState<Agreement[]>([]);
  const [rejectedOffers, setRejectedOffers] = useState<Agreement[]>([]);
  const [completedOffers, setCompletedOffers] = useState<Agreement[]>([]);
  const [deliveredOffers, setDeliveredOffers] = useState<Agreement[]>([]);
  const [disputedOffers, setDisputedOffers] = useState<Agreement[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [offerForm, setOfferForm] = useState({
    scope: '',
    price: '',
    timeline: '',
    deliverables: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState<File | null>(null);
  const [appealModalOpen, setAppealModalOpen] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealDetails, setAppealDetails] = useState('');
  const [appealEvidence, setAppealEvidence] = useState<File | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingForAgreement, setRatingForAgreement] = useState<Agreement | null>(null);
  const [ratingValue, setRatingValue] = useState(0);

  const [priceProposalModalOpen, setPriceProposalModalOpen] = useState(false);
  const [selectedAgreementForPrice, setSelectedAgreementForPrice] = useState<Agreement | null>(null);
  const [proposedPrice, setProposedPrice] = useState('');
  const [submittingPrice, setSubmittingPrice] = useState(false);

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [paymentReqModalOpen, setPaymentReqModalOpen] = useState(false);
  const [paymentReqAgreement, setPaymentReqAgreement] = useState<Agreement | null>(null);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [submittingPaymentReq, setSubmittingPaymentReq] = useState(false);
  const [existingPaymentReqIds, setExistingPaymentReqIds] = useState<Set<string>>(new Set());

  const { toasts, toast, dismiss } = useToast();

  const [pendingProposal, setPendingProposal] = useState<Agreement | null>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);

  const DISPUTE_TIMEOUT_HOURS = parseInt(process.env.NEXT_PUBLIC_DISPUTE_TIMEOUT_HOURS || '3');

  useEffect(() => {
    const getUserAndData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/login');
        return;
      }
      setUserEmail(user.email || null);
      setCurrentUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role, verified, verification_status, id_photo_url, total_agreements, completed_agreements, disputed_agreements, rejected_agreements, cancelled_agreements')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.role) {
        router.push('/role-selection');
        return;
      }

      setUserRole(profile.role);
      setUserName(profile?.full_name || user.email || null);
      setVerified(profile?.verified ?? false);
      setVerificationStatus(profile?.verification_status || 'unverified');
      setIdPhotoPath(profile?.id_photo_url || null);
      setProfileStats({
        full_name: profile.full_name || '',
        total_agreements: profile.total_agreements || 0,
        completed_agreements: profile.completed_agreements || 0,
        disputed_agreements: profile.disputed_agreements || 0,
        rejected_agreements: profile.rejected_agreements || 0,
        cancelled_agreements: profile.cancelled_agreements || 0,
      });

      const { data: existingAgreements } = await supabase
        .from('agreements')
        .select('request_id')
        .eq('consultant_id', user.id);
      const excludedRequestIds = new Set((existingAgreements || []).map(a => a.request_id));

      const { data: openRaw, error: openError } = await supabase
        .from('requests')
        .select(`
          id,
          title,
          description,
          category,
          budget_range,
          student_id,
          created_at,
          profiles!requests_student_id_fkey ( full_name )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (openError) {
        console.error(openError);
      } else {
        const filtered = (openRaw || []).filter(req => !excludedRequestIds.has(req.id));
        const mapped = filtered.map((r: any) => ({
          ...r,
          student_name: r.profiles?.full_name || 'Unknown Student',
        }));
        setOpenRequests(mapped);
      }

      const { data: allOffers, error: offerError } = await supabase
        .from('agreements')
        .select(`
          id,
          request_id,
          consultant_name,
          scope,
          price,
          timeline,
          deliverables,
          status,
          created_at,
          delivered_at,
          dispute_reason,
          dispute_details,
          appeal_reason,
          appeal_details,
          proposed_price,
          price_proposed_at,
          price_proposed_by,
          requests!agreements_request_id_fkey ( title, student_id )
        `)
        .eq('consultant_id', user.id)
        .order('created_at', { ascending: false });

      if (offerError) console.error(offerError);
      else {
        const enriched = (allOffers || []).map((o: any) => ({
          ...o,
          request_title: o.requests?.title || 'Untitled Request',
        }));
        const pending = enriched.filter((o: any) => o.status === 'pending');
        setPendingOffers(pending);
        setAcceptedOffers(enriched.filter((o: any) => o.status === 'accepted'));
        const paid = enriched.filter((o: any) => o.status === 'paid' || o.status === 'paid_held');
        setPaidOffers(paid);
        setRejectedOffers(enriched.filter((o: any) => o.status === 'rejected'));
        setCompletedOffers(enriched.filter((o: any) => o.status === 'completed'));
        setDeliveredOffers(enriched.filter((o: any) => o.status === 'delivered'));
        setDisputedOffers(enriched.filter((o: any) => o.status === 'disputed'));

        const proposalOffer = pending.find((o: any) => o.proposed_price !== null);
        if (proposalOffer && !showProposalModal) {
          setPendingProposal(proposalOffer);
          setShowProposalModal(true);
        }
      }

      // Load bank accounts and existing payment requests
      const [{ data: accounts }, { data: payReqs }] = await Promise.all([
        supabase.from('bank_accounts').select('id, bank_name, account_number, account_name, is_default').eq('consultant_id', user.id).order('created_at', { ascending: true }),
        supabase.from('payment_requests').select('agreement_id').eq('consultant_id', user.id),
      ]);
      setBankAccounts(accounts ?? []);
      setExistingPaymentReqIds(new Set((payReqs ?? []).map((r: any) => r.agreement_id)));

      setLoading(false);
    };
    getUserAndData();
  }, [router]);

  const uploadID = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;
    setUploading(true);
    const filePath = `identity_documents/${currentUserId}_${Date.now()}`;
    const { error } = await supabase.storage.from('identity_documents').upload(filePath, file);
    if (error) {
      toast('Upload failed: ' + error.message, 'error');
    } else {
      await supabase.from('profiles').update({ id_photo_url: filePath, verification_status: 'pending' }).eq('id', currentUserId);
      toast('ID submitted for verification.', 'success');
      setTimeout(() => window.location.reload(), 1200);
    }
    setUploading(false);
  };

  const previewOwnID = async () => {
    if (!idPhotoPath) return;
    const { data } = await supabase.storage.from('identity_documents').createSignedUrl(idPhotoPath, 60 * 5);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const openOfferModal = (req: Request) => {
    setSelectedRequest(req);
    setOfferForm({ scope: '', price: '', timeline: '', deliverables: '' });
    setShowModal(true);
  };

  const handleOfferChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setOfferForm({ ...offerForm, [e.target.name]: e.target.value });
  };

  const submitOffer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setSubmitting(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('You must be logged in'); setSubmitting(false); return; }

    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    const consultantName = profile?.full_name || 'Unknown Consultant';

    const priceNum = parseInt(offerForm.price, 10);
    if (isNaN(priceNum)) { setError('Price must be a number'); setSubmitting(false); return; }

    const { error: insertError } = await supabase.from('agreements').insert({
      request_id: selectedRequest.id,
      consultant_id: user.id,
      consultant_name: consultantName,
      scope: offerForm.scope,
      price: priceNum,
      timeline: offerForm.timeline,
      deliverables: offerForm.deliverables,
      status: 'pending',
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setShowModal(false);
      toast('Offer sent to the student!', 'success');
      const { data: newOffers } = await supabase
        .from('agreements')
        .select(`
          id,
          request_id,
          consultant_name,
          scope,
          price,
          timeline,
          deliverables,
          status,
          created_at,
          delivered_at,
          proposed_price,
          price_proposed_at,
          price_proposed_by,
          requests!agreements_request_id_fkey ( title, student_id )
        `)
        .eq('consultant_id', user.id)
        .order('created_at', { ascending: false });
      if (newOffers) {
        const enriched = newOffers.map((o: any) => ({
          ...o,
          request_title: o.requests?.title || 'Untitled Request',
        }));
        setPendingOffers(enriched.filter((o: any) => o.status === 'pending'));
        setAcceptedOffers(enriched.filter((o: any) => o.status === 'accepted'));
        setPaidOffers(enriched.filter((o: any) => o.status === 'paid' || o.status === 'paid_held'));
        setRejectedOffers(enriched.filter((o: any) => o.status === 'rejected'));
        setCompletedOffers(enriched.filter((o: any) => o.status === 'completed'));
        setDeliveredOffers(enriched.filter((o: any) => o.status === 'delivered'));
        setDisputedOffers(enriched.filter((o: any) => o.status === 'disputed'));
      }
    }
    setSubmitting(false);
  };

  const handleMarkDelivered = async (agreementId: string) => {
    try {
      const { error } = await supabase
        .from('agreements')
        .update({ status: 'delivered', delivered_at: new Date().toISOString() })
        .eq('id', agreementId)
        .select();
      if (error) { toast('Error marking as delivered: ' + error.message, 'error'); return; }
      try {
        await fetch('/api/email/notify-delivered', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agreementId }),
        });
      } catch (err) { console.error('Email notification failed:', err); }
      toast('Work marked as delivered. The student will review.', 'success');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast('An unexpected error occurred', 'error');
    }
  };

  const handleDispute = (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    setDisputeReason(''); setDisputeDetails(''); setDisputeEvidence(null);
    setDisputeModalOpen(true);
  };

  const submitDispute = async () => {
    if (!selectedAgreement) return;
    if (!disputeReason) { toast('Please select a reason for dispute', 'error'); return; }
    setActionLoading(selectedAgreement.id);
    let evidenceUrl = null;
    if (disputeEvidence) {
      const fileExt = disputeEvidence.name.split('.').pop();
      const fileName = `${selectedAgreement.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('dispute_evidence').upload(fileName, disputeEvidence);
      if (uploadError) console.error('Upload error:', uploadError);
      else {
        const { data: publicUrl } = supabase.storage.from('dispute_evidence').getPublicUrl(fileName);
        evidenceUrl = publicUrl.publicUrl;
      }
    }
    const { error } = await supabase.from('agreements').update({
      status: 'disputed',
      dispute_reason: disputeReason,
      dispute_details: disputeDetails + (evidenceUrl ? `\nEvidence: ${evidenceUrl}` : ''),
      dispute_raised_by: (await supabase.auth.getUser()).data.user?.id,
      dispute_raised_at: new Date().toISOString(),
    }).eq('id', selectedAgreement.id);
    if (error) { toast('Error: ' + error.message, 'error'); }
    else {
      toast('Dispute raised. Admin will be notified.', 'success');
      await supabase.from('agreement_messages').insert({
        agreement_id: selectedAgreement.id,
        sender_id: (await supabase.auth.getUser()).data.user?.id,
        message: `🚨 DISPUTE RAISED: ${disputeReason}. ${disputeDetails || 'No details provided.'}`,
      });
      setTimeout(() => window.location.reload(), 1200);
    }
    setDisputeModalOpen(false);
    setActionLoading(null);
  };

  const handleAppeal = (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    setAppealReason(''); setAppealDetails(''); setAppealEvidence(null);
    setAppealModalOpen(true);
  };

  const submitAppeal = async () => {
    if (!selectedAgreement) return;
    if (!appealReason) { toast('Please provide an appeal reason', 'error'); return; }
    setActionLoading(selectedAgreement.id);
    let evidenceUrl = null;
    if (appealEvidence) {
      const fileExt = appealEvidence.name.split('.').pop();
      const fileName = `${selectedAgreement.id}_appeal_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('dispute_evidence').upload(fileName, appealEvidence);
      if (!uploadError) {
        const { data: publicUrl } = supabase.storage.from('dispute_evidence').getPublicUrl(fileName);
        evidenceUrl = publicUrl.publicUrl;
      }
    }
    const { error } = await supabase.from('agreements').update({
      status: 'appealed',
      appeal_reason: appealReason,
      appeal_details: appealDetails + (evidenceUrl ? `\nEvidence: ${evidenceUrl}` : ''),
      appeal_raised_by: (await supabase.auth.getUser()).data.user?.id,
      appeal_raised_at: new Date().toISOString(),
    }).eq('id', selectedAgreement.id);
    if (error) { toast('Error: ' + error.message, 'error'); }
    else { toast('Appeal submitted. Admin will review shortly.', 'success'); setTimeout(() => window.location.reload(), 1200); }
    setAppealModalOpen(false);
    setActionLoading(null);
  };

  const acceptStudentProposal = async () => {
    if (!pendingProposal) return;
    const { error } = await supabase.from('agreements').update({
      price: pendingProposal.proposed_price,
      proposed_price: null,
      price_proposed_at: null,
      price_proposed_by: null,
    }).eq('id', pendingProposal.id);
    if (error) { toast('Error: ' + error.message, 'error'); }
    else { toast('Price updated. The student can now accept the offer at the new price.', 'success'); setTimeout(() => window.location.reload(), 1200); }
  };

  const declineStudentProposal = async () => {
    if (!pendingProposal) return;
    const { error } = await supabase.from('agreements').update({
      proposed_price: null,
      price_proposed_at: null,
      price_proposed_by: null,
    }).eq('id', pendingProposal.id);
    if (error) { toast('Error: ' + error.message, 'error'); }
    else { toast('Proposal declined. The original price remains.', 'info'); setTimeout(() => window.location.reload(), 1200); }
  };

  const openChat = async (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    const { data, error } = await supabase
      .from('agreement_messages')
      .select('*, sender:sender_id ( full_name )')
      .eq('agreement_id', agreement.id)
      .order('created_at', { ascending: true });
    if (error) { console.error('Chat fetch error:', error); toast('Could not load messages: ' + error.message, 'error'); }
    else {
      setChatMessages(data || []);
      setTimeout(() => { if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }, 100);
    }
    setChatModalOpen(true);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedAgreement) return;
    setSendingMessage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast('You must be logged in to send messages', 'error'); return; }
      const { error } = await supabase.from('agreement_messages').insert({ agreement_id: selectedAgreement.id, sender_id: user.id, message: newMessage.trim() });
      if (error) { console.error('Send error:', error); toast('Failed to send message: ' + error.message, 'error'); }
      else {
        setNewMessage('');
        const { data: refreshed } = await supabase.from('agreement_messages').select('*, sender:sender_id ( full_name )').eq('agreement_id', selectedAgreement.id).order('created_at', { ascending: true });
        setChatMessages(refreshed || []);
        setTimeout(() => { if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }, 100);
      }
    } catch (err) { console.error(err); toast('An error occurred while sending', 'error'); }
    finally { setSendingMessage(false); }
  };

  const openRatingModal = (agreement: Agreement) => { setRatingForAgreement(agreement); setRatingValue(0); setRatingModalOpen(true); };

  const openPaymentReqModal = (offer: Agreement) => {
    setPaymentReqAgreement(offer);
    const def = bankAccounts.find(a => a.is_default) ?? bankAccounts[0];
    setSelectedBankAccountId(def?.id ?? '');
    setPaymentReqModalOpen(true);
  };

  const submitPaymentRequest = async () => {
    if (!paymentReqAgreement || !currentUserId) return;
    if (!selectedBankAccountId) { toast('Please select a bank account.', 'error'); return; }
    setSubmittingPaymentReq(true);
    const { error } = await supabase.from('payment_requests').insert({
      agreement_id: paymentReqAgreement.id,
      consultant_id: currentUserId,
      bank_account_id: selectedBankAccountId,
      amount: paymentReqAgreement.price,
    });
    setSubmittingPaymentReq(false);
    if (error) {
      toast(error.message, 'error');
    } else {
      setExistingPaymentReqIds(prev => new Set([...prev, paymentReqAgreement.id]));
      setPaymentReqModalOpen(false);
      toast('Payment request submitted. The admin will process it shortly.', 'success');
    }
  };

  const submitRating = async () => {
    if (!ratingForAgreement || ratingValue === 0) return;
    const { error } = await supabase.from('agreements').update({ rating_given: true, rating: ratingValue }).eq('id', ratingForAgreement.id);
    if (error) { toast('Error: ' + error.message, 'error'); }
    else { toast(`Thank you for rating ${ratingValue} stars!`, 'success'); setRatingModalOpen(false); setTimeout(() => window.location.reload(), 1200); }
  };

  const proposeNewPrice = async () => {
    if (!selectedAgreementForPrice || !proposedPrice) return;
    setSubmittingPrice(true);
    const priceNum = parseInt(proposedPrice, 10);
    if (isNaN(priceNum)) { toast('Please enter a valid amount', 'error'); setSubmittingPrice(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast('You must be logged in', 'error'); setSubmittingPrice(false); return; }
    const { error } = await supabase.from('agreements').update({
      proposed_price: priceNum,
      price_proposed_at: new Date().toISOString(),
      price_proposed_by: user.id,
    }).eq('id', selectedAgreementForPrice.id);
    if (error) { toast('Error proposing price: ' + error.message, 'error'); }
    else {
      toast('Price proposed. The student will see your offer and can accept or decline.', 'success');
      setTimeout(() => window.location.reload(), 1200);
    }
    setSubmittingPrice(false);
    setPriceProposalModalOpen(false);
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  const calculateCompletionRate = () => {
    if (!profileStats) return 0;
    return Math.round(((profileStats.completed_agreements || 0) / (profileStats.total_agreements || 1)) * 100);
  };

  const canRaiseDispute = (agreement: Agreement) => {
    if (!agreement.delivered_at) return false;
    const deliveredTime = new Date(agreement.delivered_at).getTime();
    const now = new Date().getTime();
    const hoursPassed = (now - deliveredTime) / (1000 * 60 * 60);
    return hoursPassed >= DISPUTE_TIMEOUT_HOURS;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 lg:flex">
        <div className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 fixed inset-y-0 left-0">
          <div className="px-6 h-16 border-b border-slate-100 flex items-center">
            <div className="h-5 w-28 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="px-4 py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-28 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-36 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="px-3 py-4 space-y-1">
            {[...Array(9)].map((_, i) => <div key={i} className="h-9 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        </div>
        <div className="flex-1 lg:pl-64">
          <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6">
            <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl h-40 animate-pulse opacity-30" />
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(8)].map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sidebarTabs: Array<{ key: TabType; label: string; count: number; icon: React.ReactNode }> = [
    { key: 'overview', label: 'Overview', count: 0, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { key: 'open', label: 'Open Requests', count: openRequests.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> },
    { key: 'pending', label: 'Pending Offers', count: pendingOffers.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { key: 'accepted', label: 'Accepted Offers', count: acceptedOffers.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { key: 'paid', label: 'Paid', count: paidOffers.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    { key: 'delivered', label: 'Delivered', count: deliveredOffers.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg> },
    { key: 'disputed', label: 'Disputed', count: disputedOffers.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
    { key: 'rejected', label: 'Rejected', count: rejectedOffers.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { key: 'completed', label: 'Completed', count: completedOffers.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  const statCards = [
    { label: 'Open Requests', value: openRequests.length, bgClass: 'bg-blue-50', iconClass: 'text-blue-500', tab: 'open', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> },
    { label: 'Pending Offers', value: pendingOffers.length, bgClass: 'bg-amber-50', iconClass: 'text-amber-500', tab: 'pending', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Accepted Offers', value: acceptedOffers.length, bgClass: 'bg-emerald-50', iconClass: 'text-emerald-500', tab: 'accepted', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Paid', value: paidOffers.length, bgClass: 'bg-violet-50', iconClass: 'text-violet-500', tab: 'paid', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    { label: 'Delivered', value: deliveredOffers.length, bgClass: 'bg-teal-50', iconClass: 'text-teal-500', tab: 'delivered', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg> },
    { label: 'Disputed', value: disputedOffers.length, bgClass: 'bg-rose-50', iconClass: 'text-rose-500', tab: 'disputed', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
    { label: 'Rejected', value: rejectedOffers.length, bgClass: 'bg-slate-100', iconClass: 'text-slate-400', tab: 'rejected', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Completed', value: completedOffers.length, bgClass: 'bg-emerald-50', iconClass: 'text-emerald-600', tab: 'completed', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  const statusBorderColor: Record<string, string> = {
    pending: 'border-l-amber-400', accepted: 'border-l-emerald-400', paid: 'border-l-teal-400',
    delivered: 'border-l-blue-400', disputed: 'border-l-red-400', rejected: 'border-l-rose-400',
    completed: 'border-l-slate-400', appealed: 'border-l-orange-400', cancelled: 'border-l-slate-300',
  };

  const selectTab = (tabKey: TabType) => { setActiveTab(tabKey); setDrawerOpen(false); };


  const cardHeader = (offer: Agreement) => (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <div className="flex items-center gap-2">
        <Badge status={offer.status as any} />
        {offer.proposed_price && offer.status === 'pending' && (
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Proposal pending review</span>
        )}
      </div>
      <span className="text-xs text-slate-400">{formatDate(offer.created_at)}</span>
    </div>
  );

  const cardBody = (offer: Agreement) => (
    <div className="px-4 py-4 space-y-2.5">
      <div className="flex items-start gap-3">
        <span className="text-xs font-medium text-slate-400 w-24 shrink-0 pt-0.5">Request</span>
        <span className="text-sm font-semibold text-slate-800 break-words">{offer.request_title}</span>
      </div>
      <div className="flex items-start gap-3">
        <span className="text-xs font-medium text-slate-400 w-24 shrink-0 pt-0.5">Scope</span>
        <span className="text-sm text-slate-600 break-words">{offer.scope}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-400 w-24 shrink-0">Price</span>
        <span className="text-sm font-bold text-slate-900 tabular-nums">₦{offer.price.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-400 w-24 shrink-0">Timeline</span>
        <span className="text-sm text-slate-600">{offer.timeline}</span>
      </div>
      <div className="flex items-start gap-3">
        <span className="text-xs font-medium text-slate-400 w-24 shrink-0 pt-0.5">Deliverables</span>
        <span className="text-sm text-slate-600 break-words">{offer.deliverables}</span>
      </div>
      {offer.delivered_at && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-400 w-24 shrink-0">Delivered</span>
          <span className="text-sm text-slate-500">{formatDate(offer.delivered_at)}</span>
        </div>
      )}
    </div>
  );

  const chatBtn = (offer: Agreement) => (
    <button onClick={() => openChat(offer)} className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors">
      <ChatIcon /> Chat
    </button>
  );

  const renderOfferCard = (offer: Agreement, showMarkDelivered: boolean = false, showDispute: boolean = false) => (
    <div key={offer.id} onClick={(e) => { if (!(e.target as HTMLElement).closest('button, a')) router.push(`/agreement/${offer.id}`); }} className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${statusBorderColor[offer.status] ?? 'border-l-slate-300'} shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer`}>
      {cardHeader(offer)}
      {cardBody(offer)}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-3">
        {chatBtn(offer)}
        {offer.status === 'completed' && !(offer as any).rating_given && (
          <button onClick={() => openRatingModal(offer)} className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors">
            <StarIcon /> Rate Student
          </button>
        )}
        {offer.status === 'completed' && (
          existingPaymentReqIds.has(offer.id) ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Payment requested
            </span>
          ) : (
            <button onClick={() => openPaymentReqModal(offer)} className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-800 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Request Payment
            </button>
          )
        )}
        {offer.status === 'accepted' && !offer.proposed_price && (
          <Button variant="outline" size="sm" onClick={() => { setSelectedAgreementForPrice(offer); setProposedPrice(''); setPriceProposalModalOpen(true); }}>
            Propose new price
          </Button>
        )}
        {showMarkDelivered && (
          <div className="ml-auto">
            <Button variant="primary" size="sm" onClick={() => handleMarkDelivered(offer.id)}>Mark as Delivered</Button>
          </div>
        )}
        {showDispute && canRaiseDispute(offer) && (
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={() => handleDispute(offer)}>Raise Dispute</Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderOpenRequest = (req: Request) => (
    <div key={req.id} onClick={(e) => { if (!(e.target as HTMLElement).closest('button, a')) router.push(`/requests/${req.id}`); }} className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-blue-400 shadow-sm hover:shadow-md transition-all p-4 sm:p-5 cursor-pointer">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-slate-800 text-sm leading-snug break-words">{req.title}</h3>
        <Badge status="open" />
      </div>
      <p className="text-sm text-slate-600 mb-3 break-words leading-relaxed">{req.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{req.category.replace(/_/g, ' ')}</span>
        {req.budget_range && <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-medium">Budget: {req.budget_range}</span>}
      </div>
      <div className="flex items-center justify-between mt-3">
        <div>
          <p className="text-xs text-slate-400">By {req.student_name}</p>
          <p className="text-xs text-slate-400">Posted {formatDate(req.created_at)}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => openOfferModal(req)}>Make offer</Button>
      </div>
    </div>
  );

  const renderDisputedCard = (offer: Agreement) => (
    <div key={offer.id} onClick={(e) => { if (!(e.target as HTMLElement).closest('button, a')) router.push(`/agreement/${offer.id}`); }} className="bg-white rounded-2xl border border-red-200 border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer">
      <div className="flex items-center justify-between px-4 py-3 border-b border-red-100 bg-red-50">
        <Badge status="disputed" />
        <span className="text-xs text-slate-400">{formatDate(offer.created_at)}</span>
      </div>
      <div className="px-4 py-4 space-y-2.5">
        <div className="flex items-start gap-3">
          <span className="text-xs font-medium text-slate-400 w-24 shrink-0 pt-0.5">Request</span>
          <span className="text-sm font-semibold text-slate-800 break-words">{offer.request_title}</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-xs font-medium text-slate-400 w-24 shrink-0 pt-0.5">Scope</span>
          <span className="text-sm text-slate-600 break-words">{offer.scope}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-400 w-24 shrink-0">Price</span>
          <span className="text-sm font-bold text-slate-900 tabular-nums">₦{offer.price.toLocaleString()}</span>
        </div>
        {offer.dispute_reason && (
          <div className="mt-1 p-3 bg-red-50 rounded-xl border border-red-100">
            <p className="text-xs text-red-700 font-semibold mb-0.5">Dispute reason</p>
            <p className="text-xs text-red-700">{offer.dispute_reason}</p>
            {offer.dispute_details && <p className="text-xs text-red-600 mt-1">{offer.dispute_details}</p>}
          </div>
        )}
      </div>
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-2">
        {chatBtn(offer)}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => handleDispute(offer)}>Accept Dispute</Button>
          <Button variant="primary" size="sm" onClick={() => handleAppeal(offer)}>Submit Appeal</Button>
          <Button variant="outline" size="sm" onClick={() => { setReportModalOpen(true); setReportedUserId((offer as any).requests?.student_id || ''); setReportAgreementId(offer.id); }}>Report</Button>
        </div>
      </div>
    </div>
  );

  const SidebarNav = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {sidebarTabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button key={tab.key} onClick={() => selectTab(tab.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}>
            <span className={`shrink-0 ${isActive ? 'text-violet-600' : 'text-slate-400'}`}>{tab.icon}</span>
            <span className="flex-1 text-left">{tab.label}</span>
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold tabular-nums min-w-[20px] text-center ${isActive ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </>
  );

  const SidebarFooter = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <>
      <Link href="/profile" onClick={onLinkClick} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors">
        <ProfileIcon /> My Profile
      </Link>
      <Link href="/ratings" onClick={onLinkClick} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors">
        <RatingsStarIcon /> Ratings History
      </Link>
      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors">
        <SignOutIcon /> Sign out
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-30 shrink-0">
        <div className="flex items-center px-6 h-16 border-b border-slate-100">
          <Link href="/" className="text-lg font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">Accordiax</Link>
        </div>
        <div className="px-4 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center font-bold text-violet-700 text-sm shrink-0">
              {(userName || userEmail || 'C').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{userName || 'Consultant'}</p>
                {verified && <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full shrink-0">Verified</span>}
              </div>
              <p className="text-xs text-slate-400 truncate">{userEmail}</p>
            </div>
          </div>
          {userRole && <div className="mt-3"><RoleSwitcher currentRole={userRole} /></div>}
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5"><SidebarNav /></nav>
        <div className="px-3 pb-4 pt-2 border-t border-slate-100 space-y-0.5"><SidebarFooter /></div>
      </aside>

      {/* ===== MAIN AREA ===== */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 h-16 flex items-center shrink-0">
          <div className="w-full px-4 sm:px-6 flex items-center">
            <Link href="/" className="lg:hidden text-base font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Accordiax</Link>
            <div className="hidden lg:block">
              <h1 className="text-sm font-semibold text-slate-700">{sidebarTabs.find(t => t.key === activeTab)?.label || 'Overview'}</h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {userRole && <div className="hidden sm:block"><RoleSwitcher currentRole={userRole} /></div>}
              <button onClick={() => setDrawerOpen(true)} className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                <Bars3Icon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile drawer */}
        {drawerOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setDrawerOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 shrink-0">
                <Link href="/" className="text-base font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Accordiax</Link>
                <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><XMarkIcon className="h-5 w-5" /></button>
              </div>
              <div className="px-4 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center font-bold text-violet-700 text-sm shrink-0">
                    {(userName || userEmail || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{userName || 'Consultant'}</p>
                      {verified && <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full shrink-0">Verified</span>}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{userEmail}</p>
                  </div>
                </div>
                {userRole && <div className="mt-3"><RoleSwitcher currentRole={userRole} /></div>}
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5"><SidebarNav mobile /></nav>
              <div className="border-t border-slate-100 px-3 py-3 space-y-0.5 shrink-0"><SidebarFooter onLinkClick={() => setDrawerOpen(false)} /></div>
            </div>
          </>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-700 rounded-2xl p-5 sm:p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-2xl text-white shrink-0 border border-white/20">
                    {(userName || userEmail || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-violet-200 text-xs font-medium uppercase tracking-wider">Welcome back</p>
                      {verified && <span className="text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/20">Verified</span>}
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5 truncate">{userName || userEmail}</h2>
                  </div>
                </div>
                {profileStats && (
                  <div className="mt-5 bg-white/10 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-violet-100 text-xs font-medium uppercase tracking-wider">Trust Score</span>
                      <span className="text-white text-sm font-bold tabular-nums">{calculateCompletionRate()}%</span>
                    </div>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${Math.max(calculateCompletionRate(), 3)}%` }} />
                    </div>
                    <p className="text-violet-200 text-xs mt-3">
                      {profileStats.total_agreements} total, {profileStats.completed_agreements} completed, {profileStats.disputed_agreements} disputed
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {statCards.map((card) => (
                  <button key={card.label} onClick={() => selectTab(card.tab as TabType)} className="group bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all text-left">
                    <div className="mb-3">
                      <div className={`w-10 h-10 rounded-xl ${card.bgClass} flex items-center justify-center ${card.iconClass} group-hover:scale-110 transition-transform`}>
                        {card.icon}
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 tabular-nums">{card.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{card.label}</p>
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">Identity Verification</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Upload a government-issued ID to build trust with students</p>
                      </div>
                      {verificationStatus === 'verified' && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">Verified</span>}
                      {verificationStatus === 'pending' && <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shrink-0">Under review</span>}
                      {verificationStatus === 'rejected' && <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full shrink-0">Rejected</span>}
                      {verificationStatus === 'unverified' && <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full shrink-0">Not verified</span>}
                    </div>
                    {verificationStatus !== 'pending' && verificationStatus !== 'verified' && (
                      <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
                        <p className="text-xs text-slate-500 mb-2">A national ID, student ID, or passport is acceptable.</p>
                        <input type="file" accept="image/*" onChange={uploadID} disabled={uploading} className="text-xs text-slate-600 file:mr-2 file:text-xs file:font-semibold file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-violet-100 file:text-violet-700 hover:file:bg-violet-200 cursor-pointer disabled:opacity-50" />
                      </div>
                    )}
                    {idPhotoPath && <button onClick={previewOwnID} className="mt-2 text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors">Preview uploaded ID</button>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OPEN REQUESTS */}
          {activeTab === 'open' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Open Requests</h2>
                <p className="text-sm text-slate-500 mt-0.5">Browse student requests and make your offer.</p>
              </div>
              {openRequests.length === 0 ? (
                <EmptyState icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>} title="No open requests right now" description="There are no student requests available at the moment. Check back soon for new opportunities." />
              ) : <div className="space-y-3">{openRequests.map(renderOpenRequest)}</div>}
            </div>
          )}

          {/* PENDING OFFERS */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Pending Offers</h2>
                <p className="text-sm text-slate-500 mt-0.5">Offers sent to students awaiting their decision.</p>
              </div>
              {pendingOffers.length === 0 ? (
                <EmptyState icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} title="No pending offers" description="Offers you send to students will appear here while awaiting their decision." action={{ label: 'Browse open requests', onClick: () => selectTab('open') }} />
              ) : <div className="space-y-3">{pendingOffers.map((o) => renderOfferCard(o, false, false))}</div>}
            </div>
          )}

          {/* ACCEPTED OFFERS */}
          {activeTab === 'accepted' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Accepted Offers</h2>
                <p className="text-sm text-slate-500 mt-0.5">Offers accepted by students, awaiting their payment.</p>
              </div>
              {acceptedOffers.length === 0 ? (
                <EmptyState icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} title="No accepted offers" description="When a student accepts your offer, it will appear here awaiting their payment." />
              ) : <div className="space-y-3">{acceptedOffers.map((offer) => renderOfferCard(offer, false, false))}</div>}
            </div>
          )}

          {/* PAID OFFERS */}
          {activeTab === 'paid' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Paid Offers</h2>
                <p className="text-sm text-slate-500 mt-0.5">Payment received and held in escrow. Complete the work and mark as delivered.</p>
              </div>
              {paidOffers.length === 0 ? (
                <EmptyState icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} title="No paid offers" description="Offers paid by students will appear here. You can then mark your work as delivered." />
              ) : <div className="space-y-3">{paidOffers.map((o) => renderOfferCard(o, true, false))}</div>}
            </div>
          )}

          {/* DELIVERED */}
          {activeTab === 'delivered' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Delivered Work</h2>
                <p className="text-sm text-slate-500 mt-0.5">Work submitted and awaiting student approval.</p>
              </div>
              {deliveredOffers.length === 0 ? (
                <EmptyState icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>} title="No delivered work" description="Work you have marked as delivered will appear here while awaiting student approval." />
              ) : <div className="space-y-3">{deliveredOffers.map((o) => renderOfferCard(o, false, true))}</div>}
            </div>
          )}

          {/* DISPUTED */}
          {activeTab === 'disputed' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Disputed Agreements</h2>
                <p className="text-sm text-slate-500 mt-0.5">Review disputes and submit an appeal or accept the outcome.</p>
              </div>
              {disputedOffers.length === 0 ? (
                <EmptyState icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} title="No active disputes" description="You have no disputed agreements. Keep up the great work!" />
              ) : <div className="space-y-3">{disputedOffers.map(renderDisputedCard)}</div>}
            </div>
          )}

          {/* REJECTED */}
          {activeTab === 'rejected' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Rejected Offers</h2>
                <p className="text-sm text-slate-500 mt-0.5">Offers declined by students or disputes resolved against you.</p>
              </div>
              {rejectedOffers.length === 0 ? (
                <EmptyState icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} title="No rejected offers" description="Offers declined by students will appear here for your reference." />
              ) : <div className="space-y-3">{rejectedOffers.map((o) => renderOfferCard(o, false, false))}</div>}
            </div>
          )}

          {/* COMPLETED */}
          {activeTab === 'completed' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Completed Agreements</h2>
                <p className="text-sm text-slate-500 mt-0.5">Work delivered and approved. Thank you!</p>
              </div>
              {completedOffers.length === 0 ? (
                <EmptyState icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} title="No completed agreements yet" description="Agreements approved by students after delivery will appear here. Keep going!" />
              ) : <div className="space-y-3">{completedOffers.map((o) => renderOfferCard(o, false, false))}</div>}
            </div>
          )}

        </main>
      </div>

      {/* ===== MODALS ===== */}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Make an offer for: ${selectedRequest?.title || ''}`}>
        <form onSubmit={submitOffer} className="space-y-4">
          <textarea name="scope" placeholder="What will you do? (scope)" className="w-full px-4 py-2 border border-slate-300 rounded-xl" rows={2} value={offerForm.scope} onChange={handleOfferChange} required />
          <Input type="number" name="price" placeholder="Price (N)" value={offerForm.price} onChange={handleOfferChange} required />
          <Input name="timeline" placeholder="Timeline (e.g., 5 days)" value={offerForm.timeline} onChange={handleOfferChange} required />
          <textarea name="deliverables" placeholder="Deliverables" className="w-full px-4 py-2 border border-slate-300 rounded-xl" rows={2} value={offerForm.deliverables} onChange={handleOfferChange} required />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={submitting}>Send Offer</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={disputeModalOpen} onClose={() => setDisputeModalOpen(false)} title="Raise a Dispute">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Reason for dispute *</label>
            <select value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} className="w-full border rounded p-2" required>
              <option value="">Select reason</option>
              <option value="Student not responding">Student not responding to delivered work</option>
              <option value="Work completed but not approved">Work completed but not approved</option>
              <option value="Misunderstanding">Misunderstanding of requirements</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Details (optional)</label>
            <textarea value={disputeDetails} onChange={(e) => setDisputeDetails(e.target.value)} className="w-full border rounded p-2" rows={3} placeholder="Explain why you are disputing..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Upload evidence (optional)</label>
            <input type="file" onChange={(e) => setDisputeEvidence(e.target.files?.[0] || null)} className="w-full" accept="image/*,application/pdf" />
          </div>
          <Button onClick={submitDispute} loading={actionLoading === selectedAgreement?.id}>Submit Dispute</Button>
        </div>
      </Modal>

      <Modal isOpen={appealModalOpen} onClose={() => setAppealModalOpen(false)} title="Submit an Appeal">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Appeal reason *</label>
            <textarea value={appealReason} onChange={(e) => setAppealReason(e.target.value)} className="w-full border rounded p-2" rows={2} required placeholder="Briefly state why you are appealing..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Detailed explanation (optional)</label>
            <textarea value={appealDetails} onChange={(e) => setAppealDetails(e.target.value)} className="w-full border rounded p-2" rows={3} placeholder="Provide additional context or evidence..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Upload evidence (optional)</label>
            <input type="file" onChange={(e) => setAppealEvidence(e.target.files?.[0] || null)} className="w-full" accept="image/*,application/pdf" />
          </div>
          <Button onClick={submitAppeal} loading={actionLoading === selectedAgreement?.id}>Submit Appeal</Button>
        </div>
      </Modal>

      <Modal isOpen={priceProposalModalOpen} onClose={() => setPriceProposalModalOpen(false)} title="Propose new price">
        <div className="space-y-4">
          <p>Current price: N{selectedAgreementForPrice?.price?.toLocaleString()}</p>
          <input type="number" placeholder="New price (N)" value={proposedPrice} onChange={(e) => setProposedPrice(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" />
          <Button onClick={proposeNewPrice} loading={submittingPrice}>Submit Proposal</Button>
        </div>
      </Modal>

      <Modal isOpen={chatModalOpen} onClose={() => setChatModalOpen(false)} title={selectedAgreement?.request_title ? `Chat: ${selectedAgreement.request_title}` : 'Chat'}>
        <div className="h-96 flex flex-col">
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-3 mb-4 p-2 bg-slate-50 rounded-lg">
            {chatMessages.map((msg) => {
              const isOwn = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  {!isOwn && <span className="text-xs font-semibold text-slate-500 mb-1 ml-1">{msg.sender?.full_name || 'Unknown'}</span>}
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${isOwn ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                    <p className="text-sm break-words">{msg.message}</p>
                    <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-slate-400'} block text-right mt-1`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 items-center">
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" onKeyDown={(e) => e.key === 'Enter' && sendMessage()} />
            <Button onClick={sendMessage} loading={sendingMessage} size="sm" className="rounded-full px-4">Send</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={ratingModalOpen} onClose={() => setRatingModalOpen(false)} title="Rate this agreement">
        <div className="space-y-4">
          <p className="text-center">How would you rate your experience with this student?</p>
          <div className="flex justify-center gap-2">
            {[1,2,3,4,5].map((star) => (
              <button key={star} onClick={() => setRatingValue(star)} className={`text-3xl ${ratingValue >= star ? 'text-yellow-500' : 'text-gray-300'}`}>★</button>
            ))}
          </div>
          <Button onClick={submitRating} className="w-full">Submit Rating</Button>
        </div>
      </Modal>

      <Modal isOpen={showProposalModal} onClose={() => setShowProposalModal(false)} title="Student Price Proposal">
        <div className="space-y-4">
          <p>The student has proposed a new price for your offer on request:</p>
          <p><strong>{pendingProposal?.request_title}</strong></p>
          <p><strong>Original price:</strong> N{pendingProposal?.price?.toLocaleString()}</p>
          <p><strong>Proposed price:</strong> N{pendingProposal?.proposed_price?.toLocaleString()}</p>
          <div className="flex gap-3">
            <Button onClick={acceptStudentProposal}>Accept Proposal</Button>
            <Button variant="outline" onClick={declineStudentProposal}>Decline</Button>
          </div>
        </div>
      </Modal>

      <ReportModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} reportedUserId={reportedUserId} agreementId={reportAgreementId} />

      {/* Payment request modal */}
      <Modal isOpen={paymentReqModalOpen} onClose={() => setPaymentReqModalOpen(false)} title="Request Payment">
        <div className="space-y-5">
          <div className="bg-slate-50 rounded-xl p-4 space-y-1.5">
            <p className="text-xs font-medium text-slate-400">Agreement</p>
            <p className="text-sm font-semibold text-slate-800">{paymentReqAgreement?.request_title}</p>
            <p className="text-lg font-extrabold text-slate-900 tabular-nums">₦{paymentReqAgreement?.price.toLocaleString()}</p>
          </div>

          {bankAccounts.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500 mb-3">You have no bank accounts saved. Add one on your profile page first.</p>
              <a href="/profile" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                Go to Profile
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Select bank account to receive payment</p>
                {bankAccounts.map(account => (
                  <label key={account.id} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${selectedBankAccountId === account.id ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input
                      type="radio"
                      name="bank_account"
                      value={account.id}
                      checked={selectedBankAccountId === account.id}
                      onChange={() => setSelectedBankAccountId(account.id)}
                      className="accent-indigo-600"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{account.bank_name}</span>
                        {account.is_default && <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded-full">Default</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{account.account_number} &middot; {account.account_name}</p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-400">The admin team will verify your account details and process the transfer manually. You will be notified once paid.</p>
              <Button onClick={submitPaymentRequest} loading={submittingPaymentReq} className="w-full">
                Submit Payment Request
              </Button>
            </>
          )}
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
