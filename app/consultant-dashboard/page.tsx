'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RoleSwitcher from '@/components/RoleSwitcher';

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

      // Fetch open requests (only those with status = 'open')
      const { data: reqData, error: reqError } = await supabase
        .from('requests')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (reqError) console.error(reqError);
      else setRequests(reqData || []);

      // Fetch consultant's own agreements
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

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    const color = colors[status] || 'bg-gray-100 text-gray-800';
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-900">Accordiax</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{userName || userEmail}</span>
            {userRole && <RoleSwitcher currentRole={userRole} />}
            <button onClick={handleLogout} className="text-red-600 text-sm hover:underline">Logout</button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Open Requests Section */}
        <div className="bg-white rounded-2xl shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Open Requests from Students</h2>
          {requests.length === 0 ? (
            <p className="text-gray-600">No open requests at the moment.</p>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="border border-gray-400 rounded-xl p-4 hover:shadow transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800">{req.title}</h3>
                      <p className="text-gray-700 text-sm mt-1">{req.description}</p>
                      <div className="flex gap-3 mt-2 text-xs text-gray-600">
                        <span>Category: {req.category.replace('_', ' ')}</span>
                        {req.budget_range && <span>Budget: {req.budget_range}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => openOfferModal(req)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      Make offer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Offers Section */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">My Offers</h2>
          {myOffers.length === 0 ? (
            <p className="text-gray-600">You haven't made any offers yet.</p>
          ) : (
            <div className="space-y-4">
              {myOffers.map((offer) => (
                <div key={offer.id} className="border border-gray-400 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800">Offer on request #{offer.request_id.slice(0,8)}</h3>
                        {getStatusBadge(offer.status)}
                      </div>
                      <p className="text-sm text-gray-700"><strong>Scope:</strong> {offer.scope}</p>
                      <p className="text-sm text-gray-700"><strong>Price:</strong> ₦{offer.price.toLocaleString()}</p>
                      <p className="text-sm text-gray-700"><strong>Timeline:</strong> {offer.timeline}</p>
                      <p className="text-sm text-gray-700"><strong>Deliverables:</strong> {offer.deliverables}</p>
                      <p className="text-xs text-gray-500 mt-2">{new Date(offer.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Make an offer for: {selectedRequest.title}</h3>
            <form onSubmit={submitOffer}>
              <textarea
                name="scope"
                placeholder="What exactly will you do? (scope of work)"
                className="w-full p-2 border border-gray-400 rounded mb-3 text-gray-800 placeholder-gray-500"
                rows={2}
                value={offerForm.scope}
                onChange={handleOfferChange}
                required
              />
              <input
                type="number"
                name="price"
                placeholder="Price (in NGN, e.g., 5000)"
                className="w-full p-2 border border-gray-400 rounded mb-3 text-gray-800 placeholder-gray-500"
                value={offerForm.price}
                onChange={handleOfferChange}
                required
              />
              <input
                type="text"
                name="timeline"
                placeholder="Timeline (e.g., 5 days)"
                className="w-full p-2 border border-gray-400 rounded mb-3 text-gray-800 placeholder-gray-500"
                value={offerForm.timeline}
                onChange={handleOfferChange}
                required
              />
              <textarea
                name="deliverables"
                placeholder="What will be delivered? (e.g., 5000 word report, references, etc.)"
                className="w-full p-2 border border-gray-400 rounded mb-4 text-gray-800 placeholder-gray-500"
                rows={2}
                value={offerForm.deliverables}
                onChange={handleOfferChange}
                required
              />
              {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded disabled:opacity-50">
                  {submitting ? 'Sending...' : 'Send Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}