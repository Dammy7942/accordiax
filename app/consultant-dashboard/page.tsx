'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

interface ProfileStats {
  full_name: string;
  total_agreements: number;
  completed_agreements: number;
  disputed_agreements: number;
  rejected_agreements: number;
  cancelled_agreements: number;
}

type TabType = 'overview' | 'open' | 'pending' | 'accepted' | 'paid' | 'delivered' | 'disputed' | 'rejected' | 'completed';

export default function ConsultantDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
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
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingForAgreement, setRatingForAgreement] = useState<Agreement | null>(null);
  const [ratingValue, setRatingValue] = useState(0);

  // Price negotiation state (consultant-initiated)
  const [priceProposalModalOpen, setPriceProposalModalOpen] = useState(false);
  const [selectedAgreementForPrice, setSelectedAgreementForPrice] = useState<Agreement | null>(null);
  const [proposedPrice, setProposedPrice] = useState('');
  const [submittingPrice, setSubmittingPrice] = useState(false);

  // Student-initiated price proposal (consultant side)
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

      // First, get request IDs where this consultant already has an agreement
      const { data: existingAgreements } = await supabase
        .from('agreements')
        .select('request_id')
        .eq('consultant_id', user.id);
      const excludedRequestIds = new Set((existingAgreements || []).map(a => a.request_id));

      // Then fetch all open requests
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

      // Consultant's offers with request title
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
          requests!agreements_request_id_fkey ( title )
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
        setPaidOffers(enriched.filter((o: any) => o.status === 'paid'));
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

      setLoading(false);
    };
    getUserAndData();
  }, [router]);

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

  const submitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setSubmitting(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in');
      setSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    const consultantName = profile?.full_name || 'Unknown Consultant';

    const priceNum = parseInt(offerForm.price, 10);
    if (isNaN(priceNum)) {
      setError('Price must be a number');
      setSubmitting(false);
      return;
    }

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
      alert('Offer sent to student!');
      // Refresh offers
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
          requests!agreements_request_id_fkey ( title )
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
        setPaidOffers(enriched.filter((o: any) => o.status === 'paid'));
        setRejectedOffers(enriched.filter((o: any) => o.status === 'rejected'));
        setCompletedOffers(enriched.filter((o: any) => o.status === 'completed'));
        setDeliveredOffers(enriched.filter((o: any) => o.status === 'delivered'));
        setDisputedOffers(enriched.filter((o: any) => o.status === 'disputed'));
      }
    }
    setSubmitting(false);
  };

  const handleMarkDelivered = async (agreementId: string) => {
    const { error } = await supabase
      .from('agreements')
      .update({ status: 'delivered', delivered_at: new Date().toISOString() })
      .eq('id', agreementId);
    if (error) alert('Error: ' + error.message);
    else {
      alert('Work marked as delivered. Student will review.');
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
      alert('Dispute raised. Admin will be notified.');
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

  const acceptStudentProposal = async () => {
    if (!pendingProposal) return;
    const { error } = await supabase
      .from('agreements')
      .update({
        price: pendingProposal.proposed_price,
        proposed_price: null,
        price_proposed_at: null,
        price_proposed_by: null
      })
      .eq('id', pendingProposal.id);
    if (error) alert('Error: ' + error.message);
    else {
      alert('Price updated! Student can now accept the offer at the new price.');
      window.location.reload();
    }
  };

  const declineStudentProposal = async () => {
    if (!pendingProposal) return;
    const { error } = await supabase
      .from('agreements')
      .update({
        proposed_price: null,
        price_proposed_at: null,
        price_proposed_by: null
      })
      .eq('id', pendingProposal.id);
    if (error) alert('Error: ' + error.message);
    else {
      alert('Proposal declined. Original price remains.');
      window.location.reload();
    }
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

  const proposeNewPrice = async () => {
    if (!selectedAgreementForPrice || !proposedPrice) return;
    setSubmittingPrice(true);
    const priceNum = parseInt(proposedPrice, 10);
    if (isNaN(priceNum)) {
      alert('Please enter a valid amount');
      setSubmittingPrice(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('You must be logged in');
      setSubmittingPrice(false);
      return;
    }
    const { error } = await supabase
      .from('agreements')
      .update({
        proposed_price: priceNum,
        price_proposed_at: new Date().toISOString(),
        price_proposed_by: user.id
      })
      .eq('id', selectedAgreementForPrice.id);
    if (error) {
      alert('Error proposing price: ' + error.message);
    } else {
      alert('Price proposed! Student will see the offer and can accept/decline.');
      window.location.reload();
    }
    setSubmittingPrice(false);
    setPriceProposalModalOpen(false);
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

  const canRaiseDispute = (agreement: Agreement) => {
    if (!agreement.delivered_at) return false;
    const deliveredTime = new Date(agreement.delivered_at).getTime();
    const now = new Date().getTime();
    const hoursPassed = (now - deliveredTime) / (1000 * 60 * 60);
    return hoursPassed >= DISPUTE_TIMEOUT_HOURS;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Open Requests', value: openRequests.length, color: '#F59E0B', tab: 'open' },
    { label: 'Pending Offers', value: pendingOffers.length, color: '#FCD34D', tab: 'pending' },
    { label: 'Accepted Offers', value: acceptedOffers.length, color: '#5EEAD4', tab: 'accepted' },
    { label: 'Paid Offers', value: paidOffers.length, color: '#A78BFA', tab: 'paid' },
    { label: 'Delivered', value: deliveredOffers.length, color: '#60A5FA', tab: 'delivered' },
    { label: 'Disputed', value: disputedOffers.length, color: '#F97316', tab: 'disputed' },
    { label: 'Rejected Offers', value: rejectedOffers.length, color: '#F87171', tab: 'rejected' },
    { label: 'Completed', value: completedOffers.length, color: '#34D399', tab: 'completed' },
  ];

  const getCountForTab = (tab: string): number => {
    if (tab === 'open') return openRequests.length;
    if (tab === 'pending') return pendingOffers.length;
    if (tab === 'accepted') return acceptedOffers.length;
    if (tab === 'paid') return paidOffers.length;
    if (tab === 'delivered') return deliveredOffers.length;
    if (tab === 'disputed') return disputedOffers.length;
    if (tab === 'rejected') return rejectedOffers.length;
    if (tab === 'completed') return completedOffers.length;
    return 0;
  };

  const renderOfferCard = (offer: Agreement, showMarkDelivered: boolean = false, showDispute: boolean = false) => (
    <div key={offer.id} className="border border-slate-200 rounded-xl p-3 sm:p-4 hover:shadow transition break-words">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge status={offer.status as any} />
          {offer.proposed_price && offer.status === 'pending' && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Proposal awaiting review</span>
          )}
        </div>
        <p className="text-sm text-slate-600"><strong>Request:</strong> {offer.request_title}</p>
        <p className="text-sm text-slate-600"><strong>Scope:</strong> {offer.scope}</p>
        <p className="text-sm text-slate-600"><strong>Price:</strong> ₦{offer.price.toLocaleString()}</p>
        <p className="text-sm text-slate-600"><strong>Timeline:</strong> {offer.timeline}</p>
        <p className="text-sm text-slate-600"><strong>Deliverables:</strong> {offer.deliverables}</p>
        <p className="text-xs text-slate-400">Offer made: {formatDate(offer.created_at)}</p>
        {offer.delivered_at && <p className="text-xs text-slate-400">Delivered: {formatDate(offer.delivered_at)}</p>}
        <button
          onClick={() => openChat(offer)}
          className="text-xs text-blue-600 hover:underline mt-2 text-left"
        >
          💬 Chat
        </button>
        {showMarkDelivered && (
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={() => handleMarkDelivered(offer.id)}>Mark as Delivered</Button>
          </div>
        )}
        {showDispute && canRaiseDispute(offer) && (
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={() => handleDispute(offer)}>Raise Dispute</Button>
          </div>
        )}
        {offer.status === 'accepted' && !offer.proposed_price && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedAgreementForPrice(offer);
                setProposedPrice('');
                setPriceProposalModalOpen(true);
              }}
            >
              Propose new price
            </Button>
          </div>
        )}
        {offer.status === 'completed' && !(offer as any).rating_given && (
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={() => openRatingModal(offer)}>Rate Student</Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderOpenRequest = (req: Request) => (
    <div key={req.id} className="border border-slate-200 rounded-xl p-3 sm:p-4 hover:shadow transition break-words">
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="font-bold text-lg text-slate-800">{req.title}</h3>
          <p className="text-slate-600 text-sm mt-1">{req.description}</p>
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
            <span>Category: {req.category.replace('_', ' ')}</span>
            {req.budget_range && <span>Budget: {req.budget_range}</span>}
          </div>
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-400">
            <span>Posted by: {req.student_name}</span>
            <span>Posted on: {formatDate(req.created_at)}</span>
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => openOfferModal(req)}>Make offer</Button>
        </div>
      </div>
    </div>
  );

  const renderDisputedCard = (offer: Agreement) => (
    <div key={offer.id} className="border border-red-200 rounded-xl p-3 sm:p-4 hover:shadow transition break-words">
      <div className="flex flex-col gap-2">
        <div><Badge status="disputed" /></div>
        <p className="text-sm text-slate-600"><strong>Request:</strong> {offer.request_title}</p>
        <p className="text-sm text-slate-600"><strong>Scope:</strong> {offer.scope}</p>
        <p className="text-sm text-slate-600"><strong>Price:</strong> ₦{offer.price.toLocaleString()}</p>
        <p className="text-sm text-slate-600"><strong>Dispute reason:</strong> {offer.dispute_reason}</p>
        {offer.dispute_details && <p className="text-sm text-slate-600"><strong>Details:</strong> {offer.dispute_details}</p>}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => handleDispute(offer)}>Accept Dispute (Reject)</Button>
          <Button variant="primary" size="sm" onClick={() => handleAppeal(offer)}>Submit Appeal</Button>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'open', label: `Open Requests (${getCountForTab('open')})` },
    { key: 'pending', label: `Pending Offers (${getCountForTab('pending')})` },
    { key: 'accepted', label: `Accepted (${getCountForTab('accepted')})` },
    { key: 'paid', label: `Paid (${getCountForTab('paid')})` },
    { key: 'delivered', label: `Delivered (${getCountForTab('delivered')})` },
    { key: 'disputed', label: `Disputed (${getCountForTab('disputed')})` },
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
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">Accordiax</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden sm:inline text-xs sm:text-sm text-slate-600 truncate max-w-[150px]">{userName || userEmail}</span>
            {userRole && <RoleSwitcher currentRole={userRole} />}
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
                    ? 'text-purple-600 border-b-2 border-purple-600'
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
                      ? 'bg-purple-50 text-purple-600 border-l-4 border-purple-600'
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
              <p className="text-slate-600 text-sm sm:text-base mt-1">Browse open requests, manage offers, track payments, and handle disputes.</p>
              <p className="text-slate-500 text-xs sm:text-sm mt-2">Consultant Dashboard – Find students, submit offers, get paid, and build your reputation.</p>
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

        {/* Open Requests Tab */}
        {activeTab === 'open' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Open Requests from Students</h2>
              <p className="text-slate-500 text-sm">Browse and make offers on student requests.</p>
            </div>
            {openRequests.length === 0 ? <p className="text-slate-500">No open requests.</p> : <div className="space-y-4">{openRequests.map(renderOpenRequest)}</div>}
          </Card>
        )}

        {/* Pending Offers Tab */}
        {activeTab === 'pending' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Pending Offers</h2>
              <p className="text-slate-500 text-sm">Offers waiting for student decision.</p>
            </div>
            {pendingOffers.length === 0 ? <p className="text-slate-500">No pending offers.</p> : <div className="space-y-4">{pendingOffers.map((o) => renderOfferCard(o, false, false))}</div>}
          </Card>
        )}

        {/* Accepted Offers Tab */}
        {activeTab === 'accepted' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Accepted Offers</h2>
              <p className="text-slate-500 text-sm">Offers accepted by students. Awaiting payment.</p>
            </div>
            {acceptedOffers.length === 0 ? <p className="text-slate-500">No accepted offers.</p> : <div className="space-y-4">{acceptedOffers.map((o) => renderOfferCard(o, false, false))}</div>}
          </Card>
        )}

        {/* Paid Offers Tab */}
        {activeTab === 'paid' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Paid Offers</h2>
              <p className="text-slate-500 text-sm">Payments received. You can mark work as delivered.</p>
            </div>
            {paidOffers.length === 0 ? <p className="text-slate-500">No paid offers.</p> : <div className="space-y-4">{paidOffers.map((o) => renderOfferCard(o, true, false))}</div>}
          </Card>
        )}

        {/* Delivered Offers Tab */}
        {activeTab === 'delivered' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Delivered Work</h2>
              <p className="text-slate-500 text-sm">Work marked as delivered. Awaiting student approval.</p>
            </div>
            {deliveredOffers.length === 0 ? <p className="text-slate-500">No delivered work.</p> : <div className="space-y-4">{deliveredOffers.map((o) => renderOfferCard(o, false, true))}</div>}
          </Card>
        )}

        {/* Disputed Tab */}
        {activeTab === 'disputed' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Disputed Agreements</h2>
              <p className="text-slate-500 text-sm">Disputes raised. You can accept the dispute (reject) or submit an appeal.</p>
            </div>
            {disputedOffers.length === 0 ? <p className="text-slate-500">No disputed agreements.</p> : <div className="space-y-4">{disputedOffers.map(renderDisputedCard)}</div>}
          </Card>
        )}

        {/* Rejected Offers Tab */}
        {activeTab === 'rejected' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Rejected Offers</h2>
              <p className="text-slate-500 text-sm">Offers declined or disputes resolved against you.</p>
            </div>
            {rejectedOffers.length === 0 ? <p className="text-slate-500">No rejected offers.</p> : <div className="space-y-4">{rejectedOffers.map((o) => renderOfferCard(o, false, false))}</div>}
          </Card>
        )}

        {/* Completed Tab */}
        {activeTab === 'completed' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Completed Agreements</h2>
              <p className="text-slate-500 text-sm">Work delivered and approved. Thank you!</p>
            </div>
            {completedOffers.length === 0 ? <p className="text-slate-500">No completed agreements.</p> : <div className="space-y-4">{completedOffers.map((o) => renderOfferCard(o, false, false))}</div>}
          </Card>
        )}
      </main>

      {/* New Offer Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Make an offer for: ${selectedRequest?.title || ''}`}>
        <form onSubmit={submitOffer} className="space-y-4">
          <textarea name="scope" placeholder="What will you do? (scope)" className="w-full px-4 py-2 border border-slate-300 rounded-xl" rows={2} value={offerForm.scope} onChange={handleOfferChange} required />
          <Input type="number" name="price" placeholder="Price (₦)" value={offerForm.price} onChange={handleOfferChange} required />
          <Input name="timeline" placeholder="Timeline (e.g., 5 days)" value={offerForm.timeline} onChange={handleOfferChange} required />
          <textarea name="deliverables" placeholder="Deliverables" className="w-full px-4 py-2 border border-slate-300 rounded-xl" rows={2} value={offerForm.deliverables} onChange={handleOfferChange} required />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="secondary" loading={submitting}>Send Offer</Button>
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
              <option value="Student not responding">Student not responding to delivered work</option>
              <option value="Work completed but not approved">Work completed but not approved</option>
              <option value="Misunderstanding">Misunderstanding of requirements</option>
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
      <Modal isOpen={priceProposalModalOpen} onClose={() => setPriceProposalModalOpen(false)} title="Propose new price">
        <div className="space-y-4">
          <p>Current price: ₦{selectedAgreementForPrice?.price?.toLocaleString()}</p>
          <input
            type="number"
            placeholder="New price (₦)"
            value={proposedPrice}
            onChange={(e) => setProposedPrice(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2"
          />
          <Button onClick={proposeNewPrice} loading={submittingPrice}>Submit Proposal</Button>
        </div>
      </Modal>

      {/* Chat Modal */}
      <Modal isOpen={chatModalOpen} onClose={() => setChatModalOpen(false)} title={`Chat - Student`}>
        <div className="h-96 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2 bg-gray-50 rounded-lg">
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
          <p className="text-center">How would you rate your experience with this student?</p>
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

      {/* Student Price Proposal Modal */}
      <Modal isOpen={showProposalModal} onClose={() => setShowProposalModal(false)} title="Student Price Proposal">
        <div className="space-y-4">
          <p>The student has proposed a new price for your offer on request:</p>
          <p><strong>{pendingProposal?.request_title}</strong></p>
          <p><strong>Original price:</strong> ₦{pendingProposal?.price?.toLocaleString()}</p>
          <p><strong>Proposed price:</strong> ₦{pendingProposal?.proposed_price?.toLocaleString()}</p>
          <div className="flex gap-3">
            <Button onClick={acceptStudentProposal}>Accept Proposal</Button>
            <Button variant="outline" onClick={declineStudentProposal}>Decline</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}