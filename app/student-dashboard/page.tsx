'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { validateFlutterwaveKeys } from '@/lib/flutterwave';
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
  status: string;
  created_at: string;
}

interface Agreement {
  id: string;
  request_id: string;
  consultant_name: string;
  scope: string;
  price: number;
  timeline: string;
  deliverables: string;
  status: string;
  created_at: string;
  dispute_reason?: string;
  dispute_details?: string;
  dispute_raised_at?: string;
  appeal_reason?: string;
  appeal_details?: string;
  found_guilty?: boolean | null;
  resolution_notes?: string;
  proposed_price?: number;
  price_proposed_at?: string;
  price_proposed_by?: string;
}

interface ProfileStats {
  full_name: string;
  total_agreements: number;
  completed_agreements: number;
  disputed_agreements: number;
  rejected_agreements: number;
  cancelled_agreements: number;
}

type TabType = 'overview' | 'pending' | 'accepted' | 'paid' | 'delivered' | 'rejected' | 'completed' | 'myrequests';

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

export default function StudentDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'consultant' | null>(null);
  const [uploading, setUploading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>('unverified');
  const [idPhotoPath, setIdPhotoPath] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportedUserId, setReportedUserId] = useState('');
  const [reportAgreementId, setReportAgreementId] = useState<string | undefined>();
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [pendingOffers, setPendingOffers] = useState<Agreement[]>([]);
  const [acceptedAgreements, setAcceptedAgreements] = useState<Agreement[]>([]);
  const [paidAgreements, setPaidAgreements] = useState<Agreement[]>([]);
  const [rejectedAgreements, setRejectedAgreements] = useState<Agreement[]>([]);
  const [completedAgreements, setCompletedAgreements] = useState<Agreement[]>([]);
  const [deliveredAgreements, setDeliveredAgreements] = useState<Agreement[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [payingAgreement, setPayingAgreement] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'project_supervision',
    budget_range: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [customCategory, setCustomCategory] = useState('');

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
  const activeAgreementIdRef = useRef<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingForAgreement, setRatingForAgreement] = useState<Agreement | null>(null);
  const [ratingValue, setRatingValue] = useState(0);

  const [priceProposal, setPriceProposal] = useState<Agreement | null>(null);
  const [showPriceProposalModal, setShowPriceProposalModal] = useState(false);

  const { toasts, toast, dismiss } = useToast();

  const [priceProposalModalOpen, setPriceProposalModalOpen] = useState(false);
  const [selectedAgreementForProposal, setSelectedAgreementForProposal] = useState<Agreement | null>(null);
  const [selectedPendingForProposal, setSelectedPendingForProposal] = useState<Agreement | null>(null);
  const [proposedPriceInput, setProposedPriceInput] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      validateFlutterwaveKeys();
    }
  }, []);

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
        .select('full_name, role, verification_status, id_photo_url, total_agreements, completed_agreements, disputed_agreements, rejected_agreements, cancelled_agreements')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.role) {
        router.push('/role-selection');
        return;
      }

      setUserRole(profile.role);
      setUserName(profile?.full_name || user.email || null);
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

      const { data: reqData, error: reqError } = await supabase
        .from('requests')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (reqError) console.error(reqError);
      else setRequests(reqData || []);

      if (reqData && reqData.length > 0) {
        const requestIds = reqData.map(r => r.id);
        const refresh = async (status: string) => {
          const { data } = await supabase.from('agreements').select('*').in('request_id', requestIds).eq('status', status);
          return data || [];
        };
        setPendingOffers(await refresh('pending'));
        const accepted = await refresh('accepted');
        setAcceptedAgreements(accepted);
        setPaidAgreements(await refresh('paid'));
        setRejectedAgreements(await refresh('rejected'));
        setCompletedAgreements(await refresh('completed'));
        setDeliveredAgreements(await refresh('delivered'));

        const activeProposal = accepted.find(a => a.proposed_price !== null);
        if (activeProposal && !showPriceProposalModal) {
          setPriceProposal(activeProposal);
          setShowPriceProposalModal(true);
        }
      }

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('You must be logged in'); setSubmitting(false); return; }
    const categoryToSubmit = formData.category === 'other' ? customCategory : formData.category;
    const { error: insertError } = await supabase.from('requests').insert({
      student_id: user.id,
      title: formData.title,
      description: formData.description,
      category: categoryToSubmit,
      budget_range: formData.budget_range || null,
      status: 'open',
    });
    if (insertError) {
      setError(insertError.message);
    } else {
      setShowModal(false);
      setFormData({ title: '', description: '', category: 'project_supervision', budget_range: '' });
      setCustomCategory('');
      const { data: newReqs } = await supabase.from('requests').select('*').eq('student_id', user.id).order('created_at', { ascending: false });
      setRequests(newReqs || []);
      if (newReqs && newReqs.length > 0) {
        const requestIds = newReqs.map(r => r.id);
        const refresh = async (status: string) => {
          const { data } = await supabase.from('agreements').select('*').in('request_id', requestIds).eq('status', status);
          return data || [];
        };
        setPendingOffers(await refresh('pending'));
        setAcceptedAgreements(await refresh('accepted'));
        setPaidAgreements(await refresh('paid'));
        setRejectedAgreements(await refresh('rejected'));
        setCompletedAgreements(await refresh('completed'));
        setDeliveredAgreements(await refresh('delivered'));
      } else {
        setPendingOffers([]); setAcceptedAgreements([]); setPaidAgreements([]);
        setRejectedAgreements([]); setCompletedAgreements([]); setDeliveredAgreements([]);
      }
    }
    setSubmitting(false);
  };

  const handleAccept = async (agreementId: string, requestId: string) => {
    setActionLoading(agreementId);
    const { error: agreeError } = await supabase.from('agreements').update({ status: 'accepted' }).eq('id', agreementId);
    if (agreeError) { toast('Error accepting offer: ' + agreeError.message, 'error'); setActionLoading(null); return; }
    const { error: reqError } = await supabase.from('requests').update({ status: 'matched' }).eq('id', requestId);
    if (reqError) console.error('Error updating request status:', reqError);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: newReqs } = await supabase.from('requests').select('*').eq('student_id', user.id).order('created_at', { ascending: false });
      setRequests(newReqs || []);
      if (newReqs && newReqs.length > 0) {
        const requestIds = newReqs.map(r => r.id);
        const refresh = async (status: string) => {
          const { data } = await supabase.from('agreements').select('*').in('request_id', requestIds).eq('status', status);
          return data || [];
        };
        setPendingOffers(await refresh('pending'));
        setAcceptedAgreements(await refresh('accepted'));
        setPaidAgreements(await refresh('paid'));
        setRejectedAgreements(await refresh('rejected'));
        setCompletedAgreements(await refresh('completed'));
        setDeliveredAgreements(await refresh('delivered'));
      } else {
        setPendingOffers([]); setAcceptedAgreements([]); setPaidAgreements([]);
        setRejectedAgreements([]); setCompletedAgreements([]); setDeliveredAgreements([]);
      }
    }
    toast('Offer accepted! Request is now matched.', 'success');
    setActionLoading(null);
  };

  const handleReject = async (agreementId: string) => {
    setActionLoading(agreementId);
    const { error } = await supabase.from('agreements').update({ status: 'rejected' }).eq('id', agreementId);
    if (error) {
      toast('Error rejecting offer: ' + error.message, 'error');
    } else {
      setPendingOffers(prev => prev.filter(o => o.id !== agreementId));
      toast('Offer rejected.', 'success');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: newReqs } = await supabase.from('requests').select('*').eq('student_id', user.id).order('created_at', { ascending: false });
        if (newReqs && newReqs.length > 0) {
          const requestIds = newReqs.map(r => r.id);
          const refresh = async (status: string) => {
            const { data } = await supabase.from('agreements').select('*').in('request_id', requestIds).eq('status', status);
            return data || [];
          };
          setPendingOffers(await refresh('pending'));
          setAcceptedAgreements(await refresh('accepted'));
          setPaidAgreements(await refresh('paid'));
          setRejectedAgreements(await refresh('rejected'));
          setCompletedAgreements(await refresh('completed'));
          setDeliveredAgreements(await refresh('delivered'));
        }
      }
    }
    setActionLoading(null);
  };

  const handleApprove = async (agreementId: string) => {
    const { error } = await supabase.from('agreements').update({ status: 'completed' }).eq('id', agreementId);
    if (error) { toast('Error: ' + error.message, 'error'); }
    else { toast('Work approved! Agreement completed.', 'success'); setTimeout(() => window.location.reload(), 1200); }
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
      toast('Dispute raised. The consultant will be notified.', 'success');
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

  const handleProposePriceOnPending = async () => {
    if (!selectedPendingForProposal || !proposedPriceInput) return;
    const priceNum = parseInt(proposedPriceInput, 10);
    if (isNaN(priceNum) || priceNum <= 0) { toast('Please enter a valid amount', 'error'); return; }
    setSubmittingProposal(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast('You must be logged in', 'error'); setSubmittingProposal(false); return; }
    const { error } = await supabase.from('agreements').update({
      proposed_price: priceNum,
      price_proposed_at: new Date().toISOString(),
      price_proposed_by: user.id,
    }).eq('id', selectedPendingForProposal.id);
    if (error) { toast('Error proposing price: ' + error.message, 'error'); }
    else {
      toast('Price proposed. The consultant will review your request.', 'success');
      const requestIds = requests.map(r => r.id);
      const { data: newPending } = await supabase.from('agreements').select('*').in('request_id', requestIds).eq('status', 'pending');
      setPendingOffers(newPending || []);
      setPriceProposalModalOpen(false);
      setSelectedPendingForProposal(null);
      setProposedPriceInput('');
    }
    setSubmittingProposal(false);
  };

  const handleProposePrice = async () => {
    if (!selectedAgreementForProposal || !proposedPriceInput) return;
    const priceNum = parseInt(proposedPriceInput, 10);
    if (isNaN(priceNum) || priceNum <= 0) { toast('Please enter a valid amount', 'error'); return; }
    setSubmittingProposal(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast('You must be logged in', 'error'); setSubmittingProposal(false); return; }
    const { error } = await supabase.from('agreements').update({
      proposed_price: priceNum,
      price_proposed_at: new Date().toISOString(),
      price_proposed_by: user.id,
    }).eq('id', selectedAgreementForProposal.id);
    if (error) { toast('Error proposing price: ' + error.message, 'error'); }
    else {
      toast('Price proposed. The consultant will review your request.', 'success');
      const requestIds = requests.map(r => r.id);
      const { data: newAccepted } = await supabase.from('agreements').select('*').in('request_id', requestIds).eq('status', 'accepted');
      setAcceptedAgreements(newAccepted || []);
      setPriceProposalModalOpen(false);
      setSelectedAgreementForProposal(null);
      setProposedPriceInput('');
    }
    setSubmittingProposal(false);
  };

  const openChat = async (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    const { data, error } = await supabase.from('agreement_messages').select('*, sender:sender_id ( full_name )').eq('agreement_id', agreement.id).order('created_at', { ascending: true });
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

  const submitRating = async () => {
    if (!ratingForAgreement || ratingValue === 0) return;
    const { error } = await supabase.from('agreements').update({ rating_given: true, rating: ratingValue }).eq('id', ratingForAgreement.id);
    if (error) { toast('Error: ' + error.message, 'error'); }
    else { toast(`Thank you for rating ${ratingValue} stars!`, 'success'); setRatingModalOpen(false); setTimeout(() => window.location.reload(), 1200); }
  };

  const acceptPriceProposal = async () => {
    if (!priceProposal) return;
    setActionLoading(priceProposal.id);
    const { error } = await supabase.from('agreements').update({ price: priceProposal.proposed_price, proposed_price: null, price_proposed_at: null, price_proposed_by: null }).eq('id', priceProposal.id);
    if (error) { toast('Error: ' + error.message, 'error'); }
    else {
      toast('Price updated. You can now pay the new amount.', 'success');
      const requestIds = requests.map(r => r.id);
      const { data: newAccepted } = await supabase.from('agreements').select('*').in('request_id', requestIds).eq('status', 'accepted');
      setAcceptedAgreements(newAccepted || []);
      setShowPriceProposalModal(false); setPriceProposal(null);
    }
    setActionLoading(null);
  };

  const declinePriceProposal = async () => {
    if (!priceProposal) return;
    setActionLoading(priceProposal.id);
    const { error } = await supabase.from('agreements').update({ proposed_price: null, price_proposed_at: null, price_proposed_by: null }).eq('id', priceProposal.id);
    if (error) { toast('Error: ' + error.message, 'error'); }
    else {
      toast('Proposal declined. The original price remains.', 'info');
      const requestIds = requests.map(r => r.id);
      const { data: newAccepted } = await supabase.from('agreements').select('*').in('request_id', requestIds).eq('status', 'accepted');
      setAcceptedAgreements(newAccepted || []);
      setShowPriceProposalModal(false); setPriceProposal(null);
    }
    setActionLoading(null);
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  const calculateCompletionRate = () => {
    if (!profileStats) return 0;
    return Math.round(((profileStats.completed_agreements || 0) / (profileStats.total_agreements || 1)) * 100);
  };

  const flutterwaveConfig = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY!,
    tx_ref: '',
    amount: 0,
    currency: 'NGN',
    payment_options: 'card, banktransfer, ussd, mobilemoneyng',
    customer: { email: userEmail || '', phone_number: '', name: userName || 'Customer' },
    customizations: { title: 'Accordiax Payment', description: 'Secure payment for your agreement', logo: 'https://accordiax.vercel.app/logo.png' },
  };

  const initiatePayment = useFlutterwave(flutterwaveConfig);

  const handlePay = (agreement: Agreement) => {
    if (!userEmail) { toast('User email not found. Please log in again.', 'error'); return; }
    if (!process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY) { toast('Payment configuration is missing. Please contact support.', 'error'); return; }
    setPayingAgreement(agreement.id);
    activeAgreementIdRef.current = agreement.id;
    flutterwaveConfig.tx_ref = `ACC-${agreement.id}-${Date.now()}`;
    flutterwaveConfig.amount = agreement.price;
    flutterwaveConfig.customer.email = userEmail;
    flutterwaveConfig.customer.name = userName || 'Customer';
    initiatePayment({
      callback: async (response) => {
        console.log('Flutterwave callback received:', response);
        if (response.status === 'successful' || response.status === 'completed') {
          try {
            const verifyRes = await fetch('/api/flutterwave/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transaction_id: response.transaction_id, agreementId: activeAgreementIdRef.current }),
            });
            const data = await verifyRes.json();
            if (data.success) { toast('Payment successful!', 'success'); setTimeout(() => window.location.reload(), 1200); }
            else { toast('Payment verification failed: ' + (data.error || 'Please contact support.'), 'error'); }
          } catch (err) { console.error('Verification error:', err); toast('Verification error. Please contact support.', 'error'); }
        } else { toast('Payment was not successful. Please try again.', 'error'); }
        closePaymentModal();
        setPayingAgreement(null);
      },
      onClose: () => { console.log('Payment modal closed by user'); setPayingAgreement(null); },
    });
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
            {[...Array(8)].map((_, i) => <div key={i} className="h-9 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        </div>
        <div className="flex-1 lg:pl-64">
          <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6">
            <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl h-40 animate-pulse opacity-30" />
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(7)].map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sidebarTabs: Array<{ key: TabType; label: string; count: number; icon: React.ReactNode }> = [
    { key: 'overview', label: 'Overview', count: 0, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { key: 'myrequests', label: 'My Requests', count: requests.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { key: 'pending', label: 'Pending Offers', count: pendingOffers.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg> },
    { key: 'accepted', label: 'Ready to Pay', count: acceptedAgreements.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
    { key: 'paid', label: 'Paid', count: paidAgreements.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg> },
    { key: 'delivered', label: 'Delivered', count: deliveredAgreements.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg> },
    { key: 'rejected', label: 'Rejected', count: rejectedAgreements.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { key: 'completed', label: 'Completed', count: completedAgreements.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  const statCards = [
    { label: 'My Requests', value: requests.length, bgClass: 'bg-amber-50', iconClass: 'text-amber-500', tab: 'myrequests', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { label: 'Pending Offers', value: pendingOffers.length, bgClass: 'bg-amber-50', iconClass: 'text-amber-400', tab: 'pending', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg> },
    { label: 'Ready to Pay', value: acceptedAgreements.length, bgClass: 'bg-teal-50', iconClass: 'text-teal-500', tab: 'accepted', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
    { label: 'Paid', value: paidAgreements.length, bgClass: 'bg-violet-50', iconClass: 'text-violet-500', tab: 'paid', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg> },
    { label: 'Delivered', value: deliveredAgreements.length, bgClass: 'bg-blue-50', iconClass: 'text-blue-500', tab: 'delivered', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg> },
    { label: 'Rejected', value: rejectedAgreements.length, bgClass: 'bg-rose-50', iconClass: 'text-rose-500', tab: 'rejected', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Completed', value: completedAgreements.length, bgClass: 'bg-emerald-50', iconClass: 'text-emerald-500', tab: 'completed', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  const statusBorderColor: Record<string, string> = {
    pending: 'border-l-amber-400', accepted: 'border-l-emerald-400', paid: 'border-l-teal-400',
    delivered: 'border-l-blue-400', disputed: 'border-l-red-400', rejected: 'border-l-rose-400',
    completed: 'border-l-emerald-300', appealed: 'border-l-orange-400', cancelled: 'border-l-slate-300',
    open: 'border-l-blue-500', matched: 'border-l-indigo-400',
  };

  const selectTab = (tabKey: TabType) => { setActiveTab(tabKey); setDrawerOpen(false); };

  const cardFooter = (children: React.ReactNode) => (
    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-3">
      {children}
    </div>
  );

  const cardBody = (agreement: Agreement) => (
    <div className="px-4 py-4 space-y-2.5">
      <div className="flex items-start gap-3">
        <span className="text-xs font-medium text-slate-400 w-24 shrink-0 pt-0.5">Consultant</span>
        <span className="text-sm font-semibold text-slate-800 break-words">{agreement.consultant_name}</span>
      </div>
      <div className="flex items-start gap-3">
        <span className="text-xs font-medium text-slate-400 w-24 shrink-0 pt-0.5">Scope</span>
        <span className="text-sm text-slate-600 break-words">{agreement.scope}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-400 w-24 shrink-0">Price</span>
        <span className="text-sm font-bold text-slate-900 tabular-nums">₦{agreement.price.toLocaleString()}</span>
        {agreement.proposed_price && (
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            Proposal: ₦{agreement.proposed_price.toLocaleString()}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-400 w-24 shrink-0">Timeline</span>
        <span className="text-sm text-slate-600">{agreement.timeline}</span>
      </div>
      <div className="flex items-start gap-3">
        <span className="text-xs font-medium text-slate-400 w-24 shrink-0 pt-0.5">Deliverables</span>
        <span className="text-sm text-slate-600 break-words">{agreement.deliverables}</span>
      </div>
    </div>
  );

  const cardHeader = (agreement: Agreement) => (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <Badge status={agreement.status as any} />
      <span className="text-xs text-slate-400">{formatDate(agreement.created_at)}</span>
    </div>
  );

  const chatBtn = (agreement: Agreement) => (
    <button onClick={() => openChat(agreement)} className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
      <ChatIcon /> Chat
    </button>
  );

  const renderAgreementCard = (agreement: Agreement, showPayButton: boolean = false) => (
    <div key={agreement.id} onClick={(e) => { if (!(e.target as HTMLElement).closest('button, a')) router.push(`/agreement/${agreement.id}`); }} className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${statusBorderColor[agreement.status] ?? 'border-l-slate-300'} shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer`}>
      {cardHeader(agreement)}
      {cardBody(agreement)}
      {cardFooter(
        <>
          {chatBtn(agreement)}
          {agreement.status === 'completed' && !(agreement as any).rating_given && (
            <button onClick={() => openRatingModal(agreement)} className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors">
              <StarIcon /> Rate
            </button>
          )}
          {showPayButton && (
            <div className="flex-1 flex flex-wrap items-center justify-end gap-2">
              {!agreement.proposed_price && (
                <Button variant="outline" size="sm" onClick={() => { setSelectedAgreementForProposal(agreement); setProposedPriceInput(''); setPriceProposalModalOpen(true); }}>
                  Propose price
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={() => handlePay(agreement)} loading={payingAgreement === agreement.id}>Pay Now</Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderPendingOffer = (offer: Agreement) => (
    <div key={offer.id} onClick={(e) => { if (!(e.target as HTMLElement).closest('button, a')) router.push(`/agreement/${offer.id}`); }} className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-amber-400 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <Badge status="pending" />
        <span className="text-xs text-slate-400">{formatDate(offer.created_at)}</span>
      </div>
      {cardBody(offer)}
      {cardFooter(
        <>
          {chatBtn(offer)}
          <div className="flex-1 flex flex-wrap items-center justify-end gap-2">
            <Button variant="primary" size="sm" onClick={() => handleAccept(offer.id, offer.request_id)} loading={actionLoading === offer.id}>Accept</Button>
            <Button variant="outline" size="sm" onClick={() => handleReject(offer.id)} loading={actionLoading === offer.id}>Decline</Button>
            {offer.proposed_price ? (
              <span className="text-xs text-amber-600 font-medium">Proposal sent</span>
            ) : (
              <Button variant="outline" size="sm" onClick={() => { setSelectedPendingForProposal(offer); setSelectedAgreementForProposal(null); setProposedPriceInput(''); setPriceProposalModalOpen(true); }}>
                Propose price
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderDeliveredCard = (agreement: Agreement) => (
    <div key={agreement.id} onClick={(e) => { if (!(e.target as HTMLElement).closest('button, a')) router.push(`/agreement/${agreement.id}`); }} className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-blue-400 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <Badge status="delivered" />
        <span className="text-xs text-slate-400">{formatDate(agreement.created_at)}</span>
      </div>
      {cardBody(agreement)}
      {cardFooter(
        <>
          {chatBtn(agreement)}
          <div className="flex-1 flex flex-wrap items-center justify-end gap-2">
            <Button variant="primary" size="sm" onClick={() => handleApprove(agreement.id)}>Approve Work</Button>
            <Button variant="outline" size="sm" onClick={() => handleDispute(agreement)}>Raise Dispute</Button>
          </div>
        </>
      )}
    </div>
  );

  const renderRejectedCard = (agreement: Agreement) => (
    <div key={agreement.id} onClick={(e) => { if (!(e.target as HTMLElement).closest('button, a')) router.push(`/agreement/${agreement.id}`); }} className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-rose-400 overflow-hidden cursor-pointer hover:shadow-md transition-all">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <Badge status="rejected" />
        <span className="text-xs text-slate-400">{formatDate(agreement.created_at)}</span>
      </div>
      <div className="px-4 py-4 space-y-2.5">
        <div className="flex items-start gap-3">
          <span className="text-xs font-medium text-slate-400 w-24 shrink-0 pt-0.5">Consultant</span>
          <span className="text-sm font-semibold text-slate-800 break-words">{agreement.consultant_name}</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-xs font-medium text-slate-400 w-24 shrink-0 pt-0.5">Scope</span>
          <span className="text-sm text-slate-600 break-words">{agreement.scope}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-400 w-24 shrink-0">Price</span>
          <span className="text-sm font-bold text-slate-900 tabular-nums">₦{agreement.price.toLocaleString()}</span>
        </div>
        {agreement.dispute_reason && (
          <div className="mt-1 p-2 bg-rose-50 rounded-lg border border-rose-100">
            <p className="text-xs text-rose-700"><span className="font-semibold">Note:</span> {agreement.dispute_reason}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCompletedCard = (agreement: Agreement) => (
    <div key={agreement.id} onClick={(e) => { if (!(e.target as HTMLElement).closest('button, a')) router.push(`/agreement/${agreement.id}`); }} className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-emerald-300 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <Badge status="completed" />
        <span className="text-xs text-slate-400">{formatDate(agreement.created_at)}</span>
      </div>
      {cardBody(agreement)}
      {cardFooter(
        <>
          {chatBtn(agreement)}
          {!(agreement as any).rating_given && (
            <button onClick={() => openRatingModal(agreement)} className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors">
              <StarIcon /> Rate Consultant
            </button>
          )}
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setReportModalOpen(true); setReportedUserId((agreement as any).consultant_id || ''); setReportAgreementId(agreement.id); }}>
            Report
          </Button>
        </>
      )}
    </div>
  );

  const renderMyRequest = (req: Request) => (
    <div key={req.id} onClick={() => router.push(`/requests/${req.id}`)} className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${statusBorderColor[req.status] ?? 'border-l-slate-300'} shadow-sm hover:shadow-md transition-all p-4 sm:p-5 cursor-pointer`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-slate-800 text-sm leading-snug break-words">{req.title}</h3>
        <Badge status={req.status as any} />
      </div>
      <p className="text-sm text-slate-600 mb-3 break-words leading-relaxed">{req.description}</p>
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{req.category.replace(/_/g, ' ')}</span>
        {req.budget_range && <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Budget: {req.budget_range}</span>}
      </div>
      <p className="text-xs text-slate-400 mt-2">Posted {formatDate(req.created_at)}</p>
    </div>
  );

  const SidebarNav = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {sidebarTabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button key={tab.key} onClick={() => selectTab(tab.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}>
            <span className={`shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>{tab.icon}</span>
            <span className="flex-1 text-left">{tab.label}</span>
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold tabular-nums min-w-[20px] text-center ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
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
          <Link href="/" className="text-lg font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">Accordiax</Link>
        </div>
        <div className="px-4 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm shrink-0">
              {(userName || userEmail || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{userName || 'Student'}</p>
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
            <Link href="/" className="lg:hidden text-base font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Accordiax</Link>
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
                <Link href="/" className="text-base font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Accordiax</Link>
                <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><XMarkIcon className="h-5 w-5" /></button>
              </div>
              <div className="px-4 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm shrink-0">
                    {(userName || userEmail || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{userName || 'Student'}</p>
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
              <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-700 rounded-2xl p-5 sm:p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-2xl text-white shrink-0 border border-white/20">
                    {(userName || userEmail || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">Welcome back</p>
                    <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5 truncate">{userName || userEmail}</h2>
                  </div>
                </div>
                {profileStats && (
                  <div className="mt-5 bg-white/10 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-indigo-100 text-xs font-medium uppercase tracking-wider">Trust Score</span>
                      <span className="text-white text-sm font-bold tabular-nums">{calculateCompletionRate()}%</span>
                    </div>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${Math.max(calculateCompletionRate(), 3)}%` }} />
                    </div>
                    <p className="text-indigo-200 text-xs mt-3">
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
                        <p className="text-xs text-slate-400 mt-0.5">Upload a government-issued ID to build trust</p>
                      </div>
                      {verificationStatus === 'verified' && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">Verified</span>}
                      {verificationStatus === 'pending' && <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shrink-0">Under review</span>}
                      {verificationStatus === 'rejected' && <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full shrink-0">Rejected</span>}
                      {verificationStatus === 'unverified' && <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full shrink-0">Not verified</span>}
                    </div>
                    {verificationStatus !== 'pending' && verificationStatus !== 'verified' && (
                      <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
                        <p className="text-xs text-slate-500 mb-2">A national ID, student ID, or passport is acceptable.</p>
                        <input type="file" accept="image/*" onChange={uploadID} disabled={uploading} className="text-xs text-slate-600 file:mr-2 file:text-xs file:font-semibold file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer disabled:opacity-50" />
                      </div>
                    )}
                    {idPhotoPath && <button onClick={previewOwnID} className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">Preview uploaded ID</button>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MY REQUESTS */}
          {activeTab === 'myrequests' && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">My Requests</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Create and manage your service requests.</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>New Request</Button>
              </div>
              {requests.length === 0 ? (
                <EmptyState icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} title="No requests yet" description="Get started by posting your first request. Consultants on the platform will send you their offers." action={{ label: 'Post a request', onClick: () => setShowModal(true) }} />
              ) : <div className="space-y-3">{requests.map(renderMyRequest)}</div>}
            </div>
          )}

          {/* PENDING */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Pending Offers</h2>
                <p className="text-sm text-slate-500 mt-0.5">Review offers from consultants and accept or decline.</p>
              </div>
              {pendingOffers.length === 0 ? (
                <EmptyState icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>} title="No pending offers" description="No consultants have responded to your requests yet. Check back soon." />
              ) : <div className="space-y-3">{pendingOffers.map(renderPendingOffer)}</div>}
            </div>
          )}

          {/* ACCEPTED */}
          {activeTab === 'accepted' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Ready to Pay</h2>
                <p className="text-sm text-slate-500 mt-0.5">Accepted agreements awaiting your payment.</p>
              </div>
              {acceptedAgreements.length === 0 ? (
                <EmptyState icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>} title="No agreements awaiting payment" description="When you accept an offer, it will appear here ready for payment." />
              ) : <div className="space-y-3">{acceptedAgreements.map((ag) => renderAgreementCard(ag, true))}</div>}
            </div>
          )}

          {/* PAID */}
          {activeTab === 'paid' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Paid Agreements</h2>
                <p className="text-sm text-slate-500 mt-0.5">Your payment is held securely. The consultant is working on your request.</p>
              </div>
              {paidAgreements.length === 0 ? (
                <EmptyState icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>} title="No paid agreements" description="Paid agreements will appear here while the consultant delivers your work." />
              ) : <div className="space-y-3">{paidAgreements.map((ag) => renderAgreementCard(ag, false))}</div>}
            </div>
          )}

          {/* DELIVERED */}
          {activeTab === 'delivered' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Delivered Work</h2>
                <p className="text-sm text-slate-500 mt-0.5">Review the submitted work before approving or raising a dispute.</p>
              </div>
              {deliveredAgreements.length === 0 ? (
                <EmptyState icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>} title="Nothing delivered yet" description="When a consultant marks work as delivered, it will appear here for your review." />
              ) : <div className="space-y-3">{deliveredAgreements.map(renderDeliveredCard)}</div>}
            </div>
          )}

          {/* REJECTED */}
          {activeTab === 'rejected' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Rejected Offers</h2>
                <p className="text-sm text-slate-500 mt-0.5">Offers you have declined.</p>
              </div>
              {rejectedAgreements.length === 0 ? (
                <EmptyState icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} title="No rejected offers" description="Offers you decline will appear here for your records." />
              ) : <div className="space-y-3">{rejectedAgreements.map(renderRejectedCard)}</div>}
            </div>
          )}

          {/* COMPLETED */}
          {activeTab === 'completed' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Completed Agreements</h2>
                <p className="text-sm text-slate-500 mt-0.5">Work delivered and confirmed.</p>
              </div>
              {completedAgreements.length === 0 ? (
                <EmptyState icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} title="No completed agreements" description="Agreements you have approved after delivery will appear here." />
              ) : <div className="space-y-3">{completedAgreements.map(renderCompletedCard)}</div>}
            </div>
          )}

        </main>
      </div>

      {/* ===== MODALS ===== */}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setCustomCategory(''); }} title="Create a new request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="title" placeholder="Title" value={formData.title} onChange={handleChange} required />
          <textarea name="description" placeholder="Describe your needs..." className="w-full px-4 py-2 border border-slate-300 rounded-xl" rows={3} value={formData.description} onChange={handleChange} required />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Category</label>
            <select name="category" className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500" value={formData.category} onChange={(e) => { const value = e.target.value; setFormData({ ...formData, category: value }); if (value !== 'other') setCustomCategory(''); }}>
              <option value="project_supervision">Project Supervision</option>
              <option value="admission_guidance">Admission Guidance</option>
              <option value="assignment_support">Assignment Support</option>
              <option value="other">Other (specify below)</option>
            </select>
            {formData.category === 'other' && (
              <input type="text" placeholder="Enter your custom category" className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} />
            )}
          </div>
          <Input name="budget_range" placeholder="Budget range (optional)" value={formData.budget_range} onChange={handleChange} />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => { setShowModal(false); setCustomCategory(''); }}>Cancel</Button>
            <Button type="submit" loading={submitting}>Post Request</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={disputeModalOpen} onClose={() => setDisputeModalOpen(false)} title="Raise a Dispute">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Reason for dispute *</label>
            <select value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} className="w-full border rounded p-2" required>
              <option value="">Select reason</option>
              <option value="Work incomplete">Work incomplete / not delivered as agreed</option>
              <option value="Poor quality">Poor quality / not meeting requirements</option>
              <option value="Missed deadline">Missed deadline</option>
              <option value="Communication issue">Communication issue</option>
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

      <Modal isOpen={showPriceProposalModal} onClose={() => setShowPriceProposalModal(false)} title="Price Proposal">
        <div className="space-y-4">
          <p>The consultant has proposed a new price for your agreement.</p>
          <p><strong>Original price:</strong> ₦{priceProposal?.price?.toLocaleString()}</p>
          <p><strong>Proposed price:</strong> ₦{priceProposal?.proposed_price?.toLocaleString()}</p>
          <div className="flex gap-3">
            <Button onClick={acceptPriceProposal} loading={actionLoading === priceProposal?.id}>Accept</Button>
            <Button variant="outline" onClick={declinePriceProposal} loading={actionLoading === priceProposal?.id}>Decline</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={priceProposalModalOpen} onClose={() => { setPriceProposalModalOpen(false); setSelectedPendingForProposal(null); setSelectedAgreementForProposal(null); }} title="Propose new price">
        <div className="space-y-4">
          <p>Current price: ₦{(selectedPendingForProposal ?? selectedAgreementForProposal)?.price?.toLocaleString()}</p>
          <Input type="number" placeholder="Enter new price (₦)" value={proposedPriceInput} onChange={(e) => setProposedPriceInput(e.target.value)} />
          <Button onClick={selectedPendingForProposal ? handleProposePriceOnPending : handleProposePrice} loading={submittingProposal}>Submit Proposal</Button>
        </div>
      </Modal>

      <Modal isOpen={chatModalOpen} onClose={() => setChatModalOpen(false)} title={`Chat - ${selectedAgreement?.consultant_name || 'Consultant'}`}>
        <div className="h-96 flex flex-col">
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-3 mb-4 p-2 bg-gray-50 rounded-lg">
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
          <p className="text-center">How would you rate your experience?</p>
          <div className="flex justify-center gap-2">
            {[1,2,3,4,5].map((star) => (
              <button key={star} onClick={() => setRatingValue(star)} className={`text-3xl ${ratingValue >= star ? 'text-yellow-500' : 'text-gray-300'}`}>★</button>
            ))}
          </div>
          <Button onClick={submitRating} className="w-full">Submit Rating</Button>
        </div>
      </Modal>

      <ReportModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} reportedUserId={reportedUserId} agreementId={reportAgreementId} />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
