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

export default function ConsultantDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'consultant' | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [myOffers, setMyOffers] = useState<Agreement[]>([]);
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

      // Fetch open requests (status = 'open')
      const { data: reqData, error: reqError } = await supabase
        .from('requests')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (reqError) console.error(reqError);
      else setRequests(reqData || []);

      // Fetch consultant's offers
      const { data: offerData, error: offerError } = await supabase
        .from('agreements')
        .select('*')
        .eq('consultant_id', user.id)
        .order('created_at', { ascending: false });

      if (offerError) console.error(offerError);
      else setMyOffers(offerData || []);

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
      // Refresh my offers
      const { data: newOffers } = await supabase
        .from('agreements')
        .select('*')
        .eq('consultant_id', user.id)
        .order('created_at', { ascending: false });
      if (newOffers) setMyOffers(newOffers);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

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
        {/* Open Requests Section */}
        <Card>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Open Requests from Students</h2>
          {requests.length === 0 ? (
            <p className="text-slate-500">No open requests at the moment.</p>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="border border-slate-200 rounded-xl p-4 hover:shadow transition">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{req.title}</h3>
                      <p className="text-slate-600 text-sm mt-1">{req.description}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                        <span>Category: {req.category.replace('_', ' ')}</span>
                        {req.budget_range && <span>Budget: {req.budget_range}</span>}
                      </div>
                    </div>
                    <div>
                      <Button variant="secondary" size="sm" onClick={() => openOfferModal(req)}>
                        Make offer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* My Offers Section */}
        <Card>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">My Offers</h2>
          {myOffers.length === 0 ? (
            <p className="text-slate-500">You haven't made any offers yet.</p>
          ) : (
            <div className="space-y-4">
              {myOffers.map((offer) => (
                <div key={offer.id} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">Offer on request #{offer.request_id.slice(0,8)}</span>
                      <Badge status={offer.status as any} />
                    </div>
                    <span className="text-xs text-slate-400">{new Date(offer.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1"><strong>Scope:</strong> {offer.scope}</p>
                  <p className="text-sm text-slate-600"><strong>Price:</strong> ₦{offer.price.toLocaleString()}</p>
                  <p className="text-sm text-slate-600"><strong>Timeline:</strong> {offer.timeline}</p>
                  <p className="text-sm text-slate-600"><strong>Deliverables:</strong> {offer.deliverables}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>

      {/* Modal for making an offer */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Make an offer for: ${selectedRequest?.title || ''}`}>
        <form onSubmit={submitOffer} className="space-y-4">
          <textarea
            name="scope"
            placeholder="What exactly will you do? (scope of work)"
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            rows={2}
            value={offerForm.scope}
            onChange={handleOfferChange}
            required
          />
          <Input
            type="number"
            name="price"
            placeholder="Price (in NGN, e.g., 5000)"
            value={offerForm.price}
            onChange={handleOfferChange}
            required
          />
          <Input
            name="timeline"
            placeholder="Timeline (e.g., 5 days)"
            value={offerForm.timeline}
            onChange={handleOfferChange}
            required
          />
          <textarea
            name="deliverables"
            placeholder="What will be delivered? (e.g., 5000 word report, references, etc.)"
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 transition"
            rows={2}
            value={offerForm.deliverables}
            onChange={handleOfferChange}
            required
          />
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