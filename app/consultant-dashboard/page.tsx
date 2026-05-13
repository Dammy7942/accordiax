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
}

type TabType = 'overview' | 'open' | 'pending' | 'accepted' | 'paid' | 'rejected' | 'completed' | 'disputed';

export default function ConsultantDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'consultant' | null>(null);
  const [openRequests, setOpenRequests] = useState<Request[]>([]);
  const [pendingOffers, setPendingOffers] = useState<Agreement[]>([]);
  const [acceptedOffers, setAcceptedOffers] = useState<Agreement[]>([]);
  const [paidOffers, setPaidOffers] = useState<Agreement[]>([]);
  const [rejectedOffers, setRejectedOffers] = useState<Agreement[]>([]);
  const [completedOffers, setCompletedOffers] = useState<Agreement[]>([]);
  const [disputedOffers, setDisputedOffers] = useState<Agreement[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [offerForm, setOfferForm] = useState({
    scope: '',
    price: '',
    timeline: '',
    deliverables: '',
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

      // Open requests with student name
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

      if (openError) console.error(openError);
      else {
        const mapped = (openRaw || []).map((r: any) => ({
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
        setPendingOffers(enriched.filter((o: any) => o.status === 'pending'));
        setAcceptedOffers(enriched.filter((o: any) => o.status === 'accepted'));
        setPaidOffers(enriched.filter((o: any) => o.status === 'paid'));
        setRejectedOffers(enriched.filter((o: any) => o.status === 'rejected'));
        setCompletedOffers(enriched.filter((o: any) => o.status === 'completed'));
        setDisputedOffers(enriched.filter((o: any) => o.status === 'disputed'));
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
      // Refresh all offers
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
        setDisputedOffers(enriched.filter((o: any) => o.status === 'disputed'));
      }
    }
    setSubmitting(false);
  };

  const handleAcceptDispute = async (agreementId: string) => {
    const { error } = await supabase
      .from('agreements')
      .update({ status: 'rejected' })
      .eq('id', agreementId);
    if (error) alert('Error: ' + error.message);
    else { alert('Dispute accepted. Agreement rejected.'); window.location.reload(); }
  };

  const handleAppeal = async (agreementId: string) => {
    const { error } = await supabase
      .from('agreements')
      .update({ status: 'appealed' })
      .eq('id', agreementId);
    if (error) alert('Error: ' + error.message);
    else { alert('Appeal submitted. Admin will review.'); window.location.reload(); }
  };

  const handleMarkDelivered = async (agreementId: string) => {
    const { error } = await supabase
      .from('agreements')
      .update({ status: 'delivered' })
      .eq('id', agreementId);
    if (error) alert('Error: ' + error.message);
    else {
      alert('Work marked as delivered. Student will review.');
      window.location.reload();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
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
    { label: 'Rejected Offers', value: rejectedOffers.length, color: '#F87171', tab: 'rejected' },
    { label: 'Disputed', value: disputedOffers.length, color: '#F97316', tab: 'disputed' },
    { label: 'Completed', value: completedOffers.length, color: '#34D399', tab: 'completed' },
  ];

  const getCountForTab = (tab: string): number => {
    if (tab === 'open') return openRequests.length;
    if (tab === 'pending') return pendingOffers.length;
    if (tab === 'accepted') return acceptedOffers.length;
    if (tab === 'paid') return paidOffers.length;
    if (tab === 'rejected') return rejectedOffers.length;
    if (tab === 'disputed') return disputedOffers.length;
    if (tab === 'completed') return completedOffers.length;
    return 0;
  };

  const renderOfferCard = (offer: Agreement) => (
    <div key={offer.id} className="border border-slate-200 rounded-xl p-4 hover:shadow transition">
      <div className="flex flex-col gap-2">
        <div><Badge status={offer.status as any} /></div>
        <p className="text-sm text-slate-600"><strong>Request:</strong> {offer.request_title}</p>
        <p className="text-sm text-slate-600"><strong>Scope:</strong> {offer.scope}</p>
        <p className="text-sm text-slate-600"><strong>Price:</strong> ₦{offer.price.toLocaleString()}</p>
        <p className="text-sm text-slate-600"><strong>Timeline:</strong> {offer.timeline}</p>
        <p className="text-sm text-slate-600"><strong>Deliverables:</strong> {offer.deliverables}</p>
        <p className="text-xs text-slate-400">Offer made: {formatDate(offer.created_at)}</p>
        {offer.status === 'paid' && (
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={() => handleMarkDelivered(offer.id)}>
              Mark as Delivered
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderOpenRequest = (req: Request) => (
    <div key={req.id} className="border border-slate-200 rounded-xl p-4 hover:shadow transition">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-slate-800">{req.title}</h3>
          <p className="text-slate-600 text-sm mt-1">{req.description}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
            <span>Category: {req.category.replace('_', ' ')}</span>
            {req.budget_range && <span>Budget: {req.budget_range}</span>}
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400">
            <span>Posted by: {req.student_name}</span>
            <span>Posted on: {formatDate(req.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center">
          <Button variant="secondary" size="sm" onClick={() => openOfferModal(req)}>Make offer</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">Accordiax</h1>
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
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'overview' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('open')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'open' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Open Requests ({getCountForTab('open')})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'pending' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Pending Offers ({getCountForTab('pending')})
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'accepted' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Accepted Offers ({getCountForTab('accepted')})
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'paid' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Paid Offers ({getCountForTab('paid')})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'rejected' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Rejected Offers ({getCountForTab('rejected')})
          </button>
          <button
            onClick={() => setActiveTab('disputed')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'disputed' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Disputed ({getCountForTab('disputed')})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'completed' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Completed ({getCountForTab('completed')})
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-800">Welcome to your Dashboard, {userName || userEmail}.</h2>
              <p className="text-slate-600 mt-1">Browse open requests, manage your offers, and track agreements.</p>
              <p className="text-slate-500 text-sm mt-2">Consultant Dashboard – Find students who need your expertise, submit offers, get paid, and build your reputation.</p>
            </div>
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
          </>
        )}

        {/* Open Requests Tab */}
        {activeTab === 'open' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-800">Open Requests from Students</h2>
              <p className="text-slate-500 text-sm">Browse requests posted by students. Make a professional offer to help them.</p>
            </div>
            {openRequests.length === 0 ? (
              <p className="text-slate-500">No open requests at the moment.</p>
            ) : (
              <div className="space-y-4">{openRequests.map(renderOpenRequest)}</div>
            )}
          </Card>
        )}

        {/* Pending Offers Tab */}
        {activeTab === 'pending' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-800">Pending Offers</h2>
              <p className="text-slate-500 text-sm">Offers you have made that are waiting for student acceptance.</p>
            </div>
            {pendingOffers.length === 0 ? <p className="text-slate-500">No pending offers.</p> : <div className="space-y-4">{pendingOffers.map(renderOfferCard)}</div>}
          </Card>
        )}

        {/* Accepted Offers Tab */}
        {activeTab === 'accepted' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-800">Accepted Offers</h2>
              <p className="text-slate-500 text-sm">Offers accepted by students. Awaiting payment completion.</p>
            </div>
            {acceptedOffers.length === 0 ? <p className="text-slate-500">No accepted offers yet.</p> : <div className="space-y-4">{acceptedOffers.map(renderOfferCard)}</div>}
          </Card>
        )}

        {/* Paid Offers Tab */}
        {activeTab === 'paid' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-800">Paid Offers</h2>
              <p className="text-slate-500 text-sm">Payments received. You can now start the work.</p>
            </div>
            {paidOffers.length === 0 ? <p className="text-slate-500">No paid offers yet.</p> : <div className="space-y-4">{paidOffers.map(renderOfferCard)}</div>}
          </Card>
        )}

        {/* Rejected Offers Tab */}
        {activeTab === 'rejected' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-800">Rejected Offers</h2>
              <p className="text-slate-500 text-sm">Offers that were declined by students.</p>
            </div>
            {rejectedOffers.length === 0 ? <p className="text-slate-500">No rejected offers.</p> : <div className="space-y-4">{rejectedOffers.map(renderOfferCard)}</div>}
          </Card>
        )}

        {/* Disputed Tab */}
        {activeTab === 'disputed' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-800">Disputed Agreements</h2>
              <p className="text-slate-500 text-sm">A student has raised a dispute. You can accept the dispute or submit an appeal for admin review.</p>
            </div>
            {disputedOffers.length === 0 ? (
              <p className="text-slate-500">No disputed agreements.</p>
            ) : (
              <div className="space-y-4">
                {disputedOffers.map((offer) => (
                  <div key={offer.id} className="border border-red-200 rounded-xl p-4 hover:shadow transition">
                    <div className="flex flex-col gap-2">
                      <div><Badge status="disputed" /></div>
                      <p className="text-sm text-slate-600"><strong>Request:</strong> {offer.request_title}</p>
                      <p className="text-sm text-slate-600"><strong>Scope:</strong> {offer.scope}</p>
                      <p className="text-sm text-slate-600"><strong>Price:</strong> ₦{offer.price.toLocaleString()}</p>
                      <p className="text-sm text-slate-600"><strong>Timeline:</strong> {offer.timeline}</p>
                      <p className="text-sm text-slate-600"><strong>Deliverables:</strong> {offer.deliverables}</p>
                      <p className="text-xs text-slate-400">Offer made: {formatDate(offer.created_at)}</p>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => handleAcceptDispute(offer.id)}>Accept Dispute</Button>
                        <Button variant="primary" size="sm" onClick={() => handleAppeal(offer.id)}>Appeal</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Completed Tab */}
        {activeTab === 'completed' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-800">Completed Agreements</h2>
              <p className="text-slate-500 text-sm">Work delivered and confirmed. Thank you for your service.</p>
            </div>
            {completedOffers.length === 0 ? <p className="text-slate-500">No completed agreements yet.</p> : <div className="space-y-4">{completedOffers.map(renderOfferCard)}</div>}
          </Card>
        )}
      </main>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Make an offer for: ${selectedRequest?.title || ''}`}>
        <form onSubmit={submitOffer} className="space-y-4">
          <textarea name="scope" placeholder="What exactly will you do? (scope of work)" className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500" rows={2} value={offerForm.scope} onChange={handleOfferChange} required />
          <Input type="number" name="price" placeholder="Price (in NGN, e.g., 5000)" value={offerForm.price} onChange={handleOfferChange} required />
          <Input name="timeline" placeholder="Timeline (e.g., 5 days)" value={offerForm.timeline} onChange={handleOfferChange} required />
          <textarea name="deliverables" placeholder="What will be delivered? (e.g., 5000 word report, references, etc.)" className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500" rows={2} value={offerForm.deliverables} onChange={handleOfferChange} required />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="secondary" loading={submitting}>Send Offer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}