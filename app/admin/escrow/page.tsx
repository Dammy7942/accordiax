'use client';
import { useEffect, useState } from 'react';

export default function EscrowAdminPage() {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState<string | null>(null);

  const loadCompleted = async () => {
    try {
      const res = await fetch('/api/admin/escrow');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAgreements(data);
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (err) {
      console.error('Failed to load escrow data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompleted();
  }, []);

  const releasePayment = async (agreementId: string) => {
    setReleasing(agreementId);
    try {
      const res = await fetch('/api/paystack/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreementId }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Payment released successfully!');
        loadCompleted();
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setReleasing(null);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Escrow – Release Payments</h1>
        <p className="text-gray-500 mb-6">Agreements that have been approved by students and are ready for fund release.</p>
        {agreements.length === 0 ? (
          <p className="text-gray-500">No pending releases.</p>
        ) : (
          <div className="space-y-4">
            {agreements.map((ag) => (
              <div key={ag.id} className="bg-white rounded-lg shadow p-4 border">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">{ag.requests?.title || 'Untitled Request'}</p>
                    <p className="text-sm text-gray-500">Consultant ID: {ag.consultant_id}</p>
                    <p className="text-sm text-gray-500">Amount: ₦{ag.price?.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">Paystack ref: {ag.paystack_ref}</p>
                  </div>
                  <button
                    onClick={() => releasePayment(ag.id)}
                    disabled={releasing === ag.id}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                  >
                    {releasing === ag.id ? 'Releasing...' : 'Release Payment'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}