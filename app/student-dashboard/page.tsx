'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RoleSwitcher from '@/components/RoleSwitcher';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

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

declare global {
  interface Window {
    PaystackPop: any;
  }
}

type TabType = 'overview' | 'pending' | 'accepted' | 'paid' | 'delivered' | 'rejected' | 'completed' | 'myrequests';

export default function StudentDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'consultant' | null>(null);
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

  // Dispute, appeal, chat state
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

  // Price negotiation state
  const [priceProposal, setPriceProposal] = useState<Agreement | null>(null);
  const [showPriceProposalModal, setShowPriceProposalModal] = useState(false);

  // Student-initiated price proposal
  const [priceProposalModalOpen, setPriceProposalModalOpen] = useState(false);
  const [selectedAgreementForProposal, setSelectedAgreementForProposal] = useState<Agreement | null>(null);
  const [selectedPendingForProposal, setSelectedPendingForProposal] = useState<Agreement | null>(null);
  const [proposedPriceInput, setProposedPriceInput] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);

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
        .select('full_name, role, total_agreements, completed_agreements, disputed_agreements, rejected_agreements, cancelled_agreements')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.role) {
        router.push('/role-selection');
        return;
      }

      setUserRole(profile.role);
      setUserName(profile?.full_name || user.email || null);
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

        // Check for active price proposal
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
    if (!user) {
      setError('You must be logged in');
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from('requests').insert({
      student_id: user.id,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      budget_range: formData.budget_range || null,
      status: 'open',
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setShowModal(false);
      setFormData({ title: '', description: '', category: 'project_supervision', budget_range: '' });
      const { data: newReqs } = await supabase
        .from('requests')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });
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
        setPendingOffers([]);
        setAcceptedAgreements([]);
        setPaidAgreements([]);
        setRejectedAgreements([]);
        setCompletedAgreements([]);
        setDeliveredAgreements([]);
      }
    }
    setSubmitting(false);
  };

  const handleAccept = async (agreementId: string, requestId: string) => {
    setActionLoading(agreementId);
    const { error: agreeError } = await supabase
      .from('agreements')
      .update({ status: 'accepted' })
      .eq('id', agreementId);
    if (agreeError) {
      alert('Error accepting offer: ' + agreeError.message);
      setActionLoading(null);
      return;
    }
    const { error: reqError } = await supabase
      .from('requests')
      .update({ status: 'matched' })
      .eq('id', requestId);
    if (reqError) console.error('Error updating request status:', reqError);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: newReqs } = await supabase
        .from('requests')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });
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
        setPendingOffers([]);
        setAcceptedAgreements([]);
        setPaidAgreements([]);
        setRejectedAgreements([]);
        setCompletedAgreements([]);
        setDeliveredAgreements([]);
      }
    }
    alert('Offer accepted! Request is now matched.');
    setActionLoading(null);
  };

  const handleReject = async (agreementId: string) => {
    setActionLoading(agreementId);
    const { error } = await supabase
      .from('agreements')
      .update({ status: 'rejected' })
      .eq('id', agreementId);
    if (error) {
      alert('Error rejecting offer: ' + error.message);
    } else {
      setPendingOffers(prev => prev.filter(o => o.id !== agreementId));
      alert('Offer rejected.');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: newReqs } = await supabase
          .from('requests')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false });
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
    const { error } = await supabase
      .from('agreements')
      .update({ status: 'completed' })
      .eq('id', agreementId);
    if (error) alert('Error: ' + error.message);
    else {
      alert('Work approved! Agreement completed.');
      window.location.reload();
    }
  };

  const handleDispute = (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    setDisputeReason('');
    setDisputeDetails('');
    setDisputeEvidence(null);
    setDisputeModalOpen(true);
  };

  const submitDispute = async () => {
    if (!selectedAgreement) return;
    if (!disputeReason) {
      alert('Please select a reason for dispute');
      return;
    }
    setActionLoading(selectedAgreement.id);
    let evidenceUrl = null;
    if (disputeEvidence) {
      const fileExt = disputeEvidence.name.split('.').pop();
      const fileName = `${selectedAgreement.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('dispute_evidence')
        .upload(fileName, disputeEvidence);
      if (uploadError) console.error('Upload error:', uploadError);
      else {
        const { data: publicUrl } = supabase.storage
          .from('dispute_evidence')
          .getPublicUrl(fileName);
        evidenceUrl = publicUrl.publicUrl;
      }
    }
    const { error } = await supabase
      .from('agreements')
      .update({
        status: 'disputed',
        dispute_reason: disputeReason,
        dispute_details: disputeDetails + (evidenceUrl ? `\nEvidence: ${evidenceUrl}` : ''),
        dispute_raised_by: (await supabase.auth.getUser()).data.user?.id,
        dispute_raised_at: new Date().toISOString(),
      })
      .eq('id', selectedAgreement.id);
    if (error) alert('Error: ' + error.message);
    else {
      alert('Dispute raised. Consultant will be notified.');
      await supabase.from('agreement_messages').insert({
        agreement_id: selectedAgreement.id,
        sender_id: (await supabase.auth.getUser()).data.user?.id,
        message: `🚨 DISPUTE RAISED: ${disputeReason}. ${disputeDetails || 'No details provided.'}`,
      });
      window.location.reload();
    }
    setDisputeModalOpen(false);
    setActionLoading(null);
  };

  const handleAppeal = (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    setAppealReason('');
    setAppealDetails('');
    setAppealEvidence(null);
    setAppealModalOpen(true);
  };

  const submitAppeal = async () => {
    if (!selectedAgreement) return;
    if (!appealReason) {
      alert('Please provide an appeal reason');
      return;
    }
    setActionLoading(selectedAgreement.id);
    let evidenceUrl = null;
    if (appealEvidence) {
      const fileExt = appealEvidence.name.split('.').pop();
      const fileName = `${selectedAgreement.id}_appeal_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('dispute_evidence')
        .upload(fileName, appealEvidence);
      if (!uploadError) {
        const { data: publicUrl } = supabase.storage
          .from('dispute_evidence')
          .getPublicUrl(fileName);
        evidenceUrl = publicUrl.publicUrl;
      }
    }
    const { error } = await supabase
      .from('agreements')
      .update({
        status: 'appealed',
        appeal_reason: appealReason,
        appeal_details: appealDetails + (evidenceUrl ? `\nEvidence: ${evidenceUrl}` : ''),
        appeal_raised_by: (await supabase.auth.getUser()).data.user?.id,
        appeal_raised_at: new Date().toISOString(),
      })
      .eq('id', selectedAgreement.id);
    if (error) alert('Error: ' + error.message);
    else {
      alert('Appeal submitted. Admin will review.');
      window.location.reload();
    }
    setAppealModalOpen(false);
    setActionLoading(null);
  };

  const handleProposePriceOnPending = async () => {
    if (!selectedPendingForProposal || !proposedPriceInput) return;
    const priceNum = parseInt(proposedPriceInput, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    setSubmittingProposal(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('You must be logged in');
      setSubmittingProposal(false);
      return;
    }
    const { error } = await supabase
      .from('agreements')
      .update({
        proposed_price: priceNum,
        price_proposed_at: new Date().toISOString(),
        price_proposed_by: user.id
      })
      .eq('id', selectedPendingForProposal.id);
    if (error) {
      alert('Error proposing price: ' + error.message);
    } else {
      alert('Price proposed! Consultant will review your request.');
      const requestIds = requests.map(r => r.id);
      const { data: newPending } = await supabase
        .from('agreements')
        .select('*')
        .in('request_id', requestIds)
        .eq('status', 'pending');
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
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    setSubmittingProposal(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('You must be logged in');
      setSubmittingProposal(false);
      return;
    }
    const { error } = await supabase
      .from('agreements')
      .update({
        proposed_price: priceNum,
        price_proposed_at: new Date().toISOString(),
        price_proposed_by: user.id
      })
      .eq('id', selectedAgreementForProposal.id);
    if (error) {
      alert('Error proposing price: ' + error.message);
    } else {
      alert('Price proposed! Consultant will review your request.');
      const requestIds = requests.map(r => r.id);
      const { data: newAccepted } = await supabase
        .from('agreements')
        .select('*')
        .in('request_id', requestIds)
        .eq('status', 'accepted');
      setAcceptedAgreements(newAccepted || []);
      setPriceProposalModalOpen(false);
      setSelectedAgreementForProposal(null);
      setProposedPriceInput('');
    }
    setSubmittingProposal(false);
  };

  const openChat = async (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    const { data, error } = await supabase
      .from('agreement_messages')
      .select(`
        *,
        sender:sender_id (
          full_name
        )
      `)
      .eq('agreement_id', agreement.id)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Chat fetch error:', error);
      alert('Could not load messages: ' + error.message);
    } else {
      setChatMessages(data || []);
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
    setChatModalOpen(true);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedAgreement) return;
    setSendingMessage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to send messages');
        return;
      }
      const { error } = await supabase.from('agreement_messages').insert({
        agreement_id: selectedAgreement.id,
        sender_id: user.id,
        message: newMessage.trim(),
      });
      if (error) {
        console.error('Send error:', error);
        alert('Failed to send message: ' + error.message);
      } else {
        setNewMessage('');
        const { data: refreshed } = await supabase
          .from('agreement_messages')
          .select(`
            *,
            sender:sender_id (
              full_name
            )
          `)
          .eq('agreement_id', selectedAgreement.id)
          .order('created_at', { ascending: true });
        setChatMessages(refreshed || []);
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while sending');
    } finally {
      setSendingMessage(false);
    }
  };

  const openRatingModal = (agreement: Agreement) => {
    setRatingForAgreement(agreement);
    setRatingValue(0);
    setRatingModalOpen(true);
  };

  const submitRating = async () => {
    if (!ratingForAgreement || ratingValue === 0) return;
    const { error } = await supabase
      .from('agreements')
      .update({ rating_given: true, rating: ratingValue })
      .eq('id', ratingForAgreement.id);
    if (error) alert('Error: ' + error.message);
    else {
      alert(`Thank you for rating ${ratingValue} stars!`);
      setRatingModalOpen(false);
      window.location.reload();
    }
  };

  const acceptPriceProposal = async () => {
    if (!priceProposal) return;
    setActionLoading(priceProposal.id);
    const { error } = await supabase
      .from('agreements')
      .update({
        price: priceProposal.proposed_price,
        proposed_price: null,
        price_proposed_at: null,
        price_proposed_by: null
      })
      .eq('id', priceProposal.id);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Price updated! You can now pay the new amount.');
      const requestIds = requests.map(r => r.id);
      const { data: newAccepted } = await supabase
        .from('agreements')
        .select('*')
        .in('request_id', requestIds)
        .eq('status', 'accepted');
      setAcceptedAgreements(newAccepted || []);
      setShowPriceProposalModal(false);
      setPriceProposal(null);
    }
    setActionLoading(null);
  };

  const declinePriceProposal = async () => {
    if (!priceProposal) return;
    setActionLoading(priceProposal.id);
    const { error } = await supabase
      .from('agreements')
      .update({
        proposed_price: null,
        price_proposed_at: null,
        price_proposed_by: null
      })
      .eq('id', priceProposal.id);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Proposal declined. Original price remains.');
      const requestIds = requests.map(r => r.id);
      const { data: newAccepted } = await supabase
        .from('agreements')
        .select('*')
        .in('request_id', requestIds)
        .eq('status', 'accepted');
      setAcceptedAgreements(newAccepted || []);
      setShowPriceProposalModal(false);
      setPriceProposal(null);
    }
    setActionLoading(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const calculateCompletionRate = () => {
    if (!profileStats) return 0;
    const total = profileStats.total_agreements || 1;
    const completed = profileStats.completed_agreements || 0;
    return Math.round((completed / total) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'My Requests', value: requests.length, color: '#F59E0B', tab: 'myrequests' },
    { label: 'Pending Offers', value: pendingOffers.length, color: '#FCD34D', tab: 'pending' },
    { label: 'Ready for Payment', value: acceptedAgreements.length, color: '#5EEAD4', tab: 'accepted' },
    { label: 'Paid Agreements', value: paidAgreements.length, color: '#A78BFA', tab: 'paid' },
    { label: 'Delivered', value: deliveredAgreements.length, color: '#60A5FA', tab: 'delivered' },
    { label: 'Rejected Offers', value: rejectedAgreements.length, color: '#F87171', tab: 'rejected' },
    { label: 'Completed', value: completedAgreements.length, color: '#34D399', tab: 'completed' },
  ];

  const getCountForTab = (tab: string): number => {
    if (tab === 'myrequests') return requests.length;
    if (tab === 'pending') return pendingOffers.length;
    if (tab === 'accepted') return acceptedAgreements.length;
    if (tab === 'paid') return paidAgreements.length;
    if (tab === 'delivered') return deliveredAgreements.length;
    if (tab === 'rejected') return rejectedAgreements.length;
    if (tab === 'completed') return completedAgreements.length;
    return 0;
  };

  const renderAgreementCard = (agreement: Agreement, showPayButton: boolean = false) => (
    <div key={agreement.id} className="border border-slate-200 rounded-xl p-3 sm:p-4 hover:shadow transition break-words">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm text-slate-500">Consultant: {agreement.consultant_name}</p>
          <p className="text-sm text-slate-600 mt-2"><strong>Scope:</strong> {agreement.scope}</p>
          <p className="text-sm text-slate-600"><strong>Price:</strong> ₦{agreement.price.toLocaleString()}</p>
          <p className="text-sm text-slate-600"><strong>Timeline:</strong> {agreement.timeline}</p>
          <p className="text-sm text-slate-600"><strong>Deliverables:</strong> {agreement.deliverables}</p>
          <p className="text-xs text-slate-400 mt-2">Offer made: {formatDate(agreement.created_at)}</p>
          <button
            onClick={() => openChat(agreement)}
            className="text-xs text-blue-600 hover:underline mt-2"
          >
            💬 Chat
          </button>
          {agreement.status === 'completed' && !(agreement as any).rating_given && (
            <button
              onClick={() => openRatingModal(agreement)}
              className="ml-3 text-xs text-yellow-600 hover:underline"
            >
              ⭐ Rate
            </button>
          )}
        </div>
        {showPayButton && (
          <div className="flex flex-wrap gap-2 justify-end">
            {!agreement.proposed_price && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedAgreementForProposal(agreement);
                  setProposedPriceInput('');
                  setPriceProposalModalOpen(true);
                }}
              >
                Propose new price
              </Button>
            )}
            <Button variant="primary" onClick={() => handlePay(agreement)} loading={payingAgreement === agreement.id} className="whitespace-nowrap text-sm px-3 py-1.5">
              Pay Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderPendingOffer = (offer: Agreement) => (
    <div key={offer.id} className="border border-slate-200 rounded-xl p-3 sm:p-4 hover:shadow transition break-words">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm text-slate-500">From consultant: {offer.consultant_name}</p>
          <p className="text-sm text-slate-600 mt-2"><strong>Scope:</strong> {offer.scope}</p>
          <p className="text-sm text-slate-600"><strong>Price:</strong> ₦{offer.price.toLocaleString()}</p>
          <p className="text-sm text-slate-600"><strong>Timeline:</strong> {offer.timeline}</p>
          <p className="text-sm text-slate-600"><strong>Deliverables:</strong> {offer.deliverables}</p>
          <p className="text-xs text-slate-400 mt-2">Offer made: {formatDate(offer.created_at)}</p>
          <button
            onClick={() => openChat(offer)}
            className="text-xs text-blue-600 hover:underline mt-2"
          >
            💬 Chat
          </button>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="primary" size="sm" onClick={() => handleAccept(offer.id, offer.request_id)} loading={actionLoading === offer.id}>
            Accept
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleReject(offer.id)} loading={actionLoading === offer.id}>
            Reject
          </Button>
          {offer.proposed_price ? (
            <span className="text-xs text-amber-600 font-medium self-center">Proposal sent – awaiting consultant</span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedPendingForProposal(offer);
                setSelectedAgreementForProposal(null);
                setProposedPriceInput('');
                setPriceProposalModalOpen(true);
              }}
            >
              Propose new price
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const renderDeliveredCard = (agreement: Agreement) => (
    <div key={agreement.id} className="border border-slate-200 rounded-xl p-3 sm:p-4 hover:shadow transition break-words">
      <div className="flex flex-col gap-3">
        <div>
          <Badge status="delivered" />
          <p className="text-sm text-slate-500 mt-2">Consultant: {agreement.consultant_name}</p>
          <p className="text-sm text-slate-600 mt-1"><strong>Scope:</strong> {agreement.scope}</p>
          <p className="text-sm text-slate-600"><strong>Price:</strong> ₦{agreement.price.toLocaleString()}</p>
          <p className="text-sm text-slate-600"><strong>Timeline:</strong> {agreement.timeline}</p>
          <p className="text-sm text-slate-600"><strong>Deliverables:</strong> {agreement.deliverables}</p>
          <p className="text-xs text-slate-400 mt-2">Offer made: {formatDate(agreement.created_at)}</p>
          <button
            onClick={() => openChat(agreement)}
            className="text-xs text-blue-600 hover:underline mt-2"
          >
            💬 Chat
          </button>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="primary" size="sm" onClick={() => handleApprove(agreement.id)}>Approve</Button>
          <Button variant="outline" size="sm" onClick={() => handleDispute(agreement)}>Dispute</Button>
        </div>
      </div>
    </div>
  );

  const renderRejectedCard = (agreement: Agreement) => (
    <div key={agreement.id} className="border border-slate-200 rounded-xl p-3 sm:p-4 break-words">
      <div className="flex flex-col gap-2">
        <div><Badge status="rejected" /></div>
        <p className="text-sm text-slate-500">Consultant: {agreement.consultant_name}</p>
        <p className="text-sm text-slate-600"><strong>Scope:</strong> {agreement.scope}</p>
        <p className="text-sm text-slate-600"><strong>Price:</strong> ₦{agreement.price.toLocaleString()}</p>
        <p className="text-sm text-slate-600"><strong>Timeline:</strong> {agreement.timeline}</p>
        <p className="text-sm text-slate-600"><strong>Deliverables:</strong> {agreement.deliverables}</p>
        <p className="text-xs text-slate-400">Offer made: {formatDate(agreement.created_at)}</p>
        {agreement.dispute_reason && (
          <p className="text-xs text-red-500 mt-1"><strong>Dispute:</strong> {agreement.dispute_reason}</p>
        )}
      </div>
    </div>
  );

  const renderCompletedCard = (agreement: Agreement) => (
    <div key={agreement.id} className="border border-slate-200 rounded-xl p-3 sm:p-4 break-words">
      <div className="flex flex-col gap-2">
        <div><Badge status="completed" /></div>
        <p className="text-sm text-slate-500">Consultant: {agreement.consultant_name}</p>
        <p className="text-sm text-slate-600"><strong>Scope:</strong> {agreement.scope}</p>
        <p className="text-sm text-slate-600"><strong>Price:</strong> ₦{agreement.price.toLocaleString()}</p>
        <p className="text-sm text-slate-600"><strong>Timeline:</strong> {agreement.timeline}</p>
        <p className="text-sm text-slate-600"><strong>Deliverables:</strong> {agreement.deliverables}</p>
        <p className="text-xs text-slate-400">Offer made: {formatDate(agreement.created_at)}</p>
        <button
          onClick={() => openChat(agreement)}
          className="text-xs text-blue-600 hover:underline mt-2"
        >
          💬 Chat
        </button>
        {agreement.status === 'completed' && !(agreement as any).rating_given && (
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={() => openRatingModal(agreement)}>Rate Consultant</Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderMyRequest = (req: Request) => (
    <div key={req.id} className="border border-slate-200 rounded-xl p-3 sm:p-4 hover:shadow transition break-words">
      <div>
        <h3 className="font-bold text-lg text-slate-800">{req.title}</h3>
        <p className="text-slate-600 text-sm mt-1">{req.description}</p>
        <div className="flex flex-wrap gap-2 mt-2 text-xs">
          <span className="text-slate-500">Category: {req.category.replace('_', ' ')}</span>
          {req.budget_range && <span className="text-slate-500">Budget: {req.budget_range}</span>}
          <Badge status={req.status as any} />
        </div>
        <p className="text-xs text-slate-400 mt-2">Requested on: {formatDate(req.created_at)}</p>
      </div>
    </div>
  );

  const handlePay = async (agreement: Agreement) => {
    for (let i = 0; i < 30; i++) {
      if (window.PaystackPop) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!window.PaystackPop) {
      alert('Payment system not loaded. Please refresh the page and try again.');
      return;
    }
    if (!userEmail) {
      alert('User email not found. Please log in again.');
      return;
    }
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      alert('Paystack public key is missing. Please contact support.');
      return;
    }
    setPayingAgreement(agreement.id);

    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      alert('You need to be logged in to make a payment.');
      setPayingAgreement(null);
      return;
    }

    const paymentCallback = function(response: any) {
      console.log('Paystack callback received, reference:', response.reference);
      fetch('/api/paystack/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reference: response.reference, agreementId: agreement.id }),
      })
        .then(res => res.json())
        .then(data => {
          console.log('Verification response:', data);
          if (data.success) {
            alert('Payment successful! Your agreement is now paid.');
            window.location.reload();
          } else {
            alert('Payment verification failed: ' + (data.message || 'Please contact support.'));
          }
        })
        .catch(err => {
          console.error('Verification fetch error:', err);
          alert('Verification error. Please contact support.');
        })
        .finally(() => setPayingAgreement(null));
    };

    try {
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: userEmail,
        amount: agreement.price * 100,
        currency: 'NGN',
        ref: `ACC-${agreement.id}-${Date.now()}`,
        callback: paymentCallback,
        onClose: function() { setPayingAgreement(null); },
      });
      handler.openIframe();
    } catch (err) {
      console.error(err);
      alert('Unable to initialise payment. Please try again.');
      setPayingAgreement(null);
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'myrequests', label: `My Requests (${getCountForTab('myrequests')})` },
    { key: 'pending', label: `Pending (${getCountForTab('pending')})` },
    { key: 'accepted', label: `Ready to Pay (${getCountForTab('accepted')})` },
    { key: 'paid', label: `Paid (${getCountForTab('paid')})` },
    { key: 'delivered', label: `Delivered (${getCountForTab('delivered')})` },
    { key: 'rejected', label: `Rejected (${getCountForTab('rejected')})` },
    { key: 'completed', label: `Completed (${getCountForTab('completed')})` },
  ];

  const selectTab = (tabKey: TabType) => {
    setActiveTab(tabKey);
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">Accordiax</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden sm:inline text-xs sm:text-sm text-slate-600 truncate max-w-[150px]">{userName || userEmail}</span>
            {userRole && <RoleSwitcher currentRole={userRole} />}
            <span className="hidden sm:inline-flex">
              <Link href="/ratings"><Button variant="ghost" size="sm">Ratings History</Button></Link>
            </span>
            <span className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
            </span>
            <button
              onClick={() => setDrawerOpen(true)}
              className="block sm:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100 focus:outline-none"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Desktop tabs */}
      <div className="hidden sm:block border-b border-slate-200">
        <div className="container mx-auto px-4 overflow-x-auto">
          <div className="flex gap-1 sm:gap-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={() => setDrawerOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 h-1/2 bg-white shadow-2xl z-50 sm:hidden flex flex-col rounded-t-2xl">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">Navigate</h2>
              <button onClick={() => setDrawerOpen(false)} className="p-1 rounded-md text-slate-500 hover:bg-slate-100">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => selectTab(tab.key as TabType)}
                  className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="border-t border-slate-200 px-5 py-3">
              <button onClick={handleLogout} className="w-full text-left py-2 text-sm font-medium text-red-600 hover:text-red-700">Logout</button>
            </div>
          </div>
        </>
      )}

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-4 sm:p-6">
              <h3 className="text-sm sm:text-lg font-bold text-slate-800 break-words">Welcome back, {userName || userEmail}.</h3>
              <p className="text-slate-600 text-sm sm:text-base mt-1">Track your requests, offers, agreements, and payments.</p>
              <p className="text-slate-500 text-xs sm:text-sm mt-2">Student Dashboard – Post help requests, review offers, pay securely, and monitor your academic support journey.</p>
              {profileStats && (
                <div className="mt-4 p-3 bg-slate-100 rounded-lg">
                  <p className="text-sm font-medium">📊 Your Trust Score: <span className="font-bold">{calculateCompletionRate()}%</span> completion rate</p>
                  <p className="text-xs text-slate-600">Based on {profileStats.total_agreements} total agreements | {profileStats.completed_agreements} completed | {profileStats.disputed_agreements} disputes | {profileStats.cancelled_agreements} cancelled</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {statCards.map((card) => (
                <button key={card.label} onClick={() => selectTab(card.tab as TabType)} className="flex flex-col gap-2 p-4 sm:p-6 rounded-2xl border bg-white/80 backdrop-blur-sm hover:shadow-md transition-all text-left">
                  <span className="text-2xl sm:text-3xl font-bold" style={{ color: card.color }}>{card.value}</span>
                  <span className="text-xs sm:text-sm text-slate-600">{card.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* My Requests Tab */}
        {activeTab === 'myrequests' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">My Requests</h2>
              <p className="text-slate-500 text-sm">Create, manage, and track your service requests.</p>
              <Button variant="primary" className="mt-3" onClick={() => setShowModal(true)}>+ New Request</Button>
            </div>
            {requests.length === 0 ? <p className="text-slate-500">No requests yet.</p> : <div className="space-y-4">{requests.map(renderMyRequest)}</div>}
          </Card>
        )}

        {/* Pending Offers Tab */}
        {activeTab === 'pending' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Pending Offers</h2>
              <p className="text-slate-500 text-sm">Offers from consultants. Review and accept or reject.</p>
            </div>
            {pendingOffers.length === 0 ? <p className="text-slate-500">No pending offers.</p> : <div className="space-y-4">{pendingOffers.map(renderPendingOffer)}</div>}
          </Card>
        )}

        {/* Ready for Payment Tab */}
        {activeTab === 'accepted' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Ready for Payment</h2>
              <p className="text-slate-500 text-sm">Accepted agreements waiting for payment via Paystack.</p>
            </div>
            {acceptedAgreements.length === 0 ? <p className="text-slate-500">No accepted agreements awaiting payment.</p> : <div className="space-y-4">{acceptedAgreements.map((ag) => renderAgreementCard(ag, true))}</div>}
          </Card>
        )}

        {/* Paid Agreements Tab */}
        {activeTab === 'paid' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Paid Agreements</h2>
              <p className="text-slate-500 text-sm">Payments completed. Consultant will deliver.</p>
            </div>
            {paidAgreements.length === 0 ? <p className="text-slate-500">No paid agreements yet.</p> : <div className="space-y-4">{paidAgreements.map((ag) => renderAgreementCard(ag, false))}</div>}
          </Card>
        )}

        {/* Delivered Tab */}
        {activeTab === 'delivered' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Delivered Work</h2>
              <p className="text-slate-500 text-sm">The consultant has marked this work as delivered. Review and approve or raise a dispute.</p>
            </div>
            {deliveredAgreements.length === 0 ? <p className="text-slate-500">No delivered agreements yet.</p> : <div className="space-y-4">{deliveredAgreements.map(renderDeliveredCard)}</div>}
          </Card>
        )}

        {/* Rejected Offers Tab */}
        {activeTab === 'rejected' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Rejected Offers</h2>
              <p className="text-slate-500 text-sm">Offers you declined.</p>
            </div>
            {rejectedAgreements.length === 0 ? <p className="text-slate-500">No rejected offers.</p> : <div className="space-y-4">{rejectedAgreements.map(renderRejectedCard)}</div>}
          </Card>
        )}

        {/* Completed Tab */}
        {activeTab === 'completed' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Completed Agreements</h2>
              <p className="text-slate-500 text-sm">Work delivered and confirmed.</p>
            </div>
            {completedAgreements.length === 0 ? <p className="text-slate-500">No completed agreements yet.</p> : <div className="space-y-4">{completedAgreements.map(renderCompletedCard)}</div>}
          </Card>
        )}
      </main>

      {/* New Request Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create a new request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="title" placeholder="Title" value={formData.title} onChange={handleChange} required />
          <textarea name="description" placeholder="Describe your needs..." className="w-full px-4 py-2 border border-slate-300 rounded-xl" rows={3} value={formData.description} onChange={handleChange} required />
          <select name="category" className="w-full px-4 py-2 border border-slate-300 rounded-xl" value={formData.category} onChange={handleChange}>
            <option value="project_supervision">Project Supervision</option>
            <option value="admission_guidance">Admission Guidance</option>
            <option value="assignment_support">Assignment Support</option>
          </select>
          <Input name="budget_range" placeholder="Budget range (optional)" value={formData.budget_range} onChange={handleChange} />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Post Request</Button>
          </div>
        </form>
      </Modal>

      {/* Dispute Modal */}
      <Modal isOpen={disputeModalOpen} onClose={() => setDisputeModalOpen(false)} title="Raise a Dispute">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Reason for dispute *</label>
            <select
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="w-full border rounded p-2"
              required
            >
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
            <textarea
              value={disputeDetails}
              onChange={(e) => setDisputeDetails(e.target.value)}
              className="w-full border rounded p-2"
              rows={3}
              placeholder="Explain why you are disputing..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Upload evidence (optional)</label>
            <input
              type="file"
              onChange={(e) => setDisputeEvidence(e.target.files?.[0] || null)}
              className="w-full"
              accept="image/*,application/pdf"
            />
          </div>
          <Button onClick={submitDispute} loading={actionLoading === selectedAgreement?.id}>Submit Dispute</Button>
        </div>
      </Modal>

      {/* Appeal Modal */}
      <Modal isOpen={appealModalOpen} onClose={() => setAppealModalOpen(false)} title="Submit an Appeal">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Appeal reason *</label>
            <textarea
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              className="w-full border rounded p-2"
              rows={2}
              required
              placeholder="Briefly state why you are appealing..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Detailed explanation (optional)</label>
            <textarea
              value={appealDetails}
              onChange={(e) => setAppealDetails(e.target.value)}
              className="w-full border rounded p-2"
              rows={3}
              placeholder="Provide additional context or evidence..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Upload evidence (optional)</label>
            <input
              type="file"
              onChange={(e) => setAppealEvidence(e.target.files?.[0] || null)}
              className="w-full"
              accept="image/*,application/pdf"
            />
          </div>
          <Button onClick={submitAppeal} loading={actionLoading === selectedAgreement?.id}>Submit Appeal</Button>
        </div>
      </Modal>

      {/* Price Proposal Modal */}
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

      {/* Student Propose Price Modal */}
      <Modal isOpen={priceProposalModalOpen} onClose={() => { setPriceProposalModalOpen(false); setSelectedPendingForProposal(null); setSelectedAgreementForProposal(null); }} title="Propose new price">
        <div className="space-y-4">
          <p>Current price: ₦{(selectedPendingForProposal ?? selectedAgreementForProposal)?.price?.toLocaleString()}</p>
          <Input
            type="number"
            placeholder="Enter new price (₦)"
            value={proposedPriceInput}
            onChange={(e) => setProposedPriceInput(e.target.value)}
          />
          <Button onClick={selectedPendingForProposal ? handleProposePriceOnPending : handleProposePrice} loading={submittingProposal}>Submit Proposal</Button>
        </div>
      </Modal>

      {/* Chat Modal */}
      <Modal isOpen={chatModalOpen} onClose={() => setChatModalOpen(false)} title={`Chat - ${selectedAgreement?.consultant_name || 'Consultant'}`}>
        <div className="h-96 flex flex-col">
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-3 mb-4 p-2 bg-gray-50 rounded-lg">
            {chatMessages.map((msg) => {
              const isOwn = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  {!isOwn && (
                    <span className="text-xs font-semibold text-slate-500 mb-1 ml-1">
                      {msg.sender?.full_name || 'Unknown'}
                    </span>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${isOwn ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                    <p className="text-sm break-words">{msg.message}</p>
                    <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-slate-400'} block text-right mt-1`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage} loading={sendingMessage} size="sm" className="rounded-full px-4">Send</Button>
          </div>
        </div>
      </Modal>

      {/* Rating Modal */}
      <Modal isOpen={ratingModalOpen} onClose={() => setRatingModalOpen(false)} title="Rate this agreement">
        <div className="space-y-4">
          <p className="text-center">How would you rate your experience?</p>
          <div className="flex justify-center gap-2">
            {[1,2,3,4,5].map((star) => (
              <button
                key={star}
                onClick={() => setRatingValue(star)}
                className={`text-3xl ${ratingValue >= star ? 'text-yellow-500' : 'text-gray-300'}`}
              >
                ★
              </button>
            ))}
          </div>
          <Button onClick={submitRating} className="w-full">Submit Rating</Button>
        </div>
      </Modal>
    </div>
  );
}