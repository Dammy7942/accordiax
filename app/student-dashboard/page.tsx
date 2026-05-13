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
}

declare global {
  interface Window {
    PaystackPop: any;
  }
}

type TabType = 'overview' | 'pending' | 'accepted' | 'paid' | 'rejected' | 'completed';

export default function StudentDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'consultant' | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [pendingOffers, setPendingOffers] = useState<Agreement[]>([]);
  const [acceptedAgreements, setAcceptedAgreements] = useState<Agreement[]>([]);
  const [paidAgreements, setPaidAgreements] = useState<Agreement[]>([]);
  const [rejectedAgreements, setRejectedAgreements] = useState<Agreement[]>([]);
  const [completedAgreements, setCompletedAgreements] = useState<Agreement[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [payingAgreement, setPayingAgreement] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'project_supervision',
    budget_range: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const getUserAndData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/login');
        return;
      }
      setUserEmail(user.email || null);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.role) {
        router.push('/role-selection');
        return;
      }

      setUserRole(profile.role);
      setUserName(profile?.full_name || user.email || null);

      const { data: reqData, error: reqError } = await supabase
        .from('requests')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (reqError) console.error(reqError);
      else setRequests(reqData || []);

      if (reqData && reqData.length > 0) {
        const requestIds = reqData.map(r => r.id);
        const { data: pendingData } = await supabase
          .from('agreements')
          .select('*')
          .in('request_id', requestIds)
          .eq('status', 'pending');
        setPendingOffers(pendingData || []);

        const { data: acceptedData } = await supabase
          .from('agreements')
          .select('*')
          .in('request_id', requestIds)
          .eq('status', 'accepted');
        setAcceptedAgreements(acceptedData || []);

        const { data: paidData } = await supabase
          .from('agreements')
          .select('*')
          .in('request_id', requestIds)
          .eq('status', 'paid');
        setPaidAgreements(paidData || []);

        const { data: rejectedData } = await supabase
          .from('agreements')
          .select('*')
          .in('request_id', requestIds)
          .eq('status', 'rejected');
        setRejectedAgreements(rejectedData || []);

        const { data: completedData } = await supabase
          .from('agreements')
          .select('*')
          .in('request_id', requestIds)
          .eq('status', 'completed');
        setCompletedAgreements(completedData || []);
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
      // Refresh all data
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
      } else {
        setPendingOffers([]);
        setAcceptedAgreements([]);
        setPaidAgreements([]);
        setRejectedAgreements([]);
        setCompletedAgreements([]);
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
      } else {
        setPendingOffers([]);
        setAcceptedAgreements([]);
        setPaidAgreements([]);
        setRejectedAgreements([]);
        setCompletedAgreements([]);
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
      // Remove from pending list
      setPendingOffers(prev => prev.filter(o => o.id !== agreementId));
      alert('Offer rejected.');
      // We will refresh all agreements later; but for immediate UI, we also need to add to rejected list.
      // Simpler: reload or just refetch. We'll do a full refresh in background.
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
        }
      }
    }
    setActionLoading(null);
  };

  const handlePay = async (agreement: Agreement) => {
    // Wait for Paystack script to load
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
          if (data.success) {
            alert('Payment successful! Your agreement is now paid.');
            window.location.reload();
          } else {
            alert('Payment verification failed. Please contact support.');
          }
        })
        .catch(err => {
          console.error(err);
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Pending Offers', value: pendingOffers.length, color: '#FCD34D', tab: 'pending' },
    { label: 'Ready for Payment', value: acceptedAgreements.length, color: '#5EEAD4', tab: 'accepted' },
    { label: 'Paid Agreements', value: paidAgreements.length, color: '#A78BFA', tab: 'paid' },
    { label: 'Rejected Offers', value: rejectedAgreements.length, color: '#F87171', tab: 'rejected' },
    { label: 'Completed', value: completedAgreements.length, color: '#34D399', tab: 'completed' },
  ];

  const renderAgreementCard = (agreement: Agreement, showPayButton: boolean = false) => (
    <div key={agreement.id} className="border border-slate-200 rounded-xl p-4 hover:shadow transition">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-slate-500">Consultant: {agreement.consultant_name}</p>
          <p className="text-sm text-slate-600 mt-2"><strong>Scope:</strong> {agreement.scope}</p>
          <p className="text-sm text-slate-600"><strong>Price:</strong> ₦{agreement.price.toLocaleString()}</p>
          <p className="text-sm text-slate-600"><strong>Timeline:</strong> {agreement.timeline}</p>
          <p className="text-sm text-slate-600"><strong>Deliverables:</strong> {agreement.deliverables}</p>
          <p className="text-xs text-slate-400 mt-2">Offer made: {formatDate(agreement.created_at)}</p>
        </div>
        {showPayButton && (
          <div className="flex items-center">
            <Button
              variant="primary"
              onClick={() => handlePay(agreement)}
              loading={payingAgreement === agreement.id}
              className="whitespace-nowrap"
            >
              Pay Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderPendingOffer = (offer: Agreement) => (
    <div key={offer.id} className="border border-slate-200 rounded-xl p-4 hover:shadow transition">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-slate-500">From consultant: {offer.consultant_name}</p>
          <p className="text-sm text-slate-600 mt-2"><strong>Scope:</strong> {offer.scope}</p>
          <p className="text-sm text-slate-600"><strong>Price:</strong> ₦{offer.price.toLocaleString()}</p>
          <p className="text-sm text-slate-600"><strong>Timeline:</strong> {offer.timeline}</p>
          <p className="text-sm text-slate-600"><strong>Deliverables:</strong> {offer.deliverables}</p>
          <p className="text-xs text-slate-400 mt-2">Offer made: {formatDate(offer.created_at)}</p>
        </div>
        <div className="flex gap-2 items-start">
          <Button variant="primary" size="sm" onClick={() => handleAccept(offer.id, offer.request_id)} loading={actionLoading === offer.id}>
            Accept
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleReject(offer.id)} loading={actionLoading === offer.id}>
            Reject
          </Button>
        </div>
      </div>
    </div>
  );

  const renderRejectedCard = (agreement: Agreement) => (
    <div key={agreement.id} className="border border-slate-200 rounded-xl p-4">
      <div className="flex flex-col gap-2">
        <div><Badge status="rejected" /></div>
        <p className="text-sm text-slate-500">Consultant: {agreement.consultant_name}</p>
        <p className="text-sm text-slate-600"><strong>Scope:</strong> {agreement.scope}</p>
        <p className="text-sm text-slate-600"><strong>Price:</strong> ₦{agreement.price.toLocaleString()}</p>
        <p className="text-sm text-slate-600"><strong>Timeline:</strong> {agreement.timeline}</p>
        <p className="text-sm text-slate-600"><strong>Deliverables:</strong> {agreement.deliverables}</p>
        <p className="text-xs text-slate-400">Offer made: {formatDate(agreement.created_at)}</p>
      </div>
    </div>
  );

  const renderCompletedCard = (agreement: Agreement) => (
    <div key={agreement.id} className="border border-slate-200 rounded-xl p-4">
      <div className="flex flex-col gap-2">
        <div><Badge status="completed" /></div>
        <p className="text-sm text-slate-500">Consultant: {agreement.consultant_name}</p>
        <p className="text-sm text-slate-600"><strong>Scope:</strong> {agreement.scope}</p>
        <p className="text-sm text-slate-600"><strong>Price:</strong> ₦{agreement.price.toLocaleString()}</p>
        <p className="text-sm text-slate-600"><strong>Timeline:</strong> {agreement.timeline}</p>
        <p className="text-sm text-slate-600"><strong>Deliverables:</strong> {agreement.deliverables}</p>
        <p className="text-xs text-slate-400">Offer made: {formatDate(agreement.created_at)}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">Accordiax</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{userName || userEmail}</span>
            {userRole && <RoleSwitcher currentRole={userRole} />}
            <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Tab Bar */}
        <div className="flex flex-wrap border-b border-slate-200 gap-2">
          {['overview', 'pending', 'accepted', 'paid', 'rejected', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as TabType)}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'overview' ? 'Overview' : `${tab.charAt(0).toUpperCase() + tab.slice(1)} (${getCountForTab(tab)})`}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((card) => (
              <button
                key={card.label}
                onClick={() => setActiveTab(card.tab as TabType)}
                className="flex flex-col gap-3 p-6 rounded-2xl border bg-white/80 backdrop-blur-sm hover:shadow-md transition-all"
                style={{ borderColor: '#CBD5E1', textAlign: 'left' }}
              >
                <span className="text-3xl font-bold" style={{ color: card.color }}>{card.value}</span>
                <span className="text-sm text-slate-600">{card.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Detail Tabs Content */}
        {activeTab === 'pending' && (
          <Card>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Pending Offers</h2>
            {pendingOffers.length === 0 ? <p className="text-slate-500">No pending offers.</p> : <div className="space-y-4">{pendingOffers.map(renderPendingOffer)}</div>}
          </Card>
        )}

        {activeTab === 'accepted' && (
          <Card>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Accepted Agreements – Ready for Payment</h2>
            {acceptedAgreements.length === 0 ? <p className="text-slate-500">No accepted agreements awaiting payment.</p> : <div className="space-y-4">{acceptedAgreements.map((ag) => renderAgreementCard(ag, true))}</div>}
          </Card>
        )}

        {activeTab === 'paid' && (
          <Card>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Paid Agreements</h2>
            {paidAgreements.length === 0 ? <p className="text-slate-500">No paid agreements yet.</p> : <div className="space-y-4">{paidAgreements.map((ag) => renderAgreementCard(ag, false))}</div>}
          </Card>
        )}

        {activeTab === 'rejected' && (
          <Card>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Rejected Offers</h2>
            {rejectedAgreements.length === 0 ? <p className="text-slate-500">No rejected offers.</p> : <div className="space-y-4">{rejectedAgreements.map(renderRejectedCard)}</div>}
          </Card>
        )}

        {activeTab === 'completed' && (
          <Card>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Completed Agreements</h2>
            {completedAgreements.length === 0 ? <p className="text-slate-500">No completed agreements yet.</p> : <div className="space-y-4">{completedAgreements.map(renderCompletedCard)}</div>}
          </Card>
        )}

        {/* My Requests Section (always visible) */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-800">My Requests</h2>
            <Button variant="primary" onClick={() => setShowModal(true)}>+ New Request</Button>
          </div>
          {requests.length === 0 ? (
            <p className="text-slate-500">You haven't posted any requests yet.</p>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="border border-slate-200 rounded-xl p-4 hover:shadow transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{req.title}</h3>
                      <p className="text-slate-600 text-sm mt-1">{req.description}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs">
                        <span className="text-slate-500">Category: {req.category.replace('_', ' ')}</span>
                        {req.budget_range && <span className="text-slate-500">Budget: {req.budget_range}</span>}
                        <Badge status={req.status as any} />
                      </div>
                      <p className="text-xs text-slate-400 mt-2">Requested on: {formatDate(req.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create a new request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="title" placeholder="Title (e.g., Help with final year project)" value={formData.title} onChange={handleChange} required />
          <textarea name="description" placeholder="Describe what you need help with..." className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500" rows={3} value={formData.description} onChange={handleChange} required />
          <select name="category" className="w-full px-4 py-2 border border-slate-300 rounded-xl" value={formData.category} onChange={handleChange}>
            <option value="project_supervision">Project Supervision</option>
            <option value="admission_guidance">Admission Guidance</option>
            <option value="assignment_support">Assignment Support</option>
          </select>
          <Input name="budget_range" placeholder="Budget range (optional, e.g., ₦5,000 - ₦10,000)" value={formData.budget_range} onChange={handleChange} />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Post Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );

  function getCountForTab(tab: string): number {
    if (tab === 'pending') return pendingOffers.length;
    if (tab === 'accepted') return acceptedAgreements.length;
    if (tab === 'paid') return paidAgreements.length;
    if (tab === 'rejected') return rejectedAgreements.length;
    if (tab === 'completed') return completedAgreements.length;
    return 0;
  }
}