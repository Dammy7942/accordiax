'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function AgreementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgreement = async () => {
      const { data, error } = await supabase
        .from('agreements')
        .select(`
          *,
          requests (title, description, student_id, budget_range),
          consultant:profiles!fk_agreements_consultant_profiles (full_name)
        `)
        .eq('id', params.id)
        .single();
      if (error) {
        console.error(error);
      } else {
        setAgreement(data);
      }
      setLoading(false);
    };
    fetchAgreement();
  }, [params.id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!agreement) return <div className="p-8">Agreement not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" onClick={() => router.push('/admin')} className="mb-4">← Back to Admin</Button>
        <Card>
          <h1 className="text-2xl font-bold mb-4">Agreement Details</h1>
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold">Request:</h2>
              <p>{agreement.requests?.title}</p>
              <p className="text-sm text-slate-600">{agreement.requests?.description}</p>
              <p className="text-sm text-slate-500">Budget: {agreement.requests?.budget_range}</p>
            </div>
            <div>
              <h2 className="font-semibold">Consultant:</h2>
              <p>{agreement.consultant?.full_name || 'Unknown'}</p>
            </div>
            <div>
              <h2 className="font-semibold">Agreed Terms:</h2>
              <p><strong>Scope:</strong> {agreement.scope}</p>
              <p><strong>Price:</strong> ₦{agreement.price?.toLocaleString()}</p>
              <p><strong>Timeline:</strong> {agreement.timeline}</p>
              <p><strong>Deliverables:</strong> {agreement.deliverables}</p>
            </div>
            <div>
              <h2 className="font-semibold">Status:</h2>
              <Badge status={agreement.status} />
            </div>
            {agreement.dispute_reason && (
              <div>
                <h2 className="font-semibold text-red-600">Dispute Reason:</h2>
                <p>{agreement.dispute_reason}</p>
                <p className="text-sm">{agreement.dispute_details}</p>
              </div>
            )}
            {agreement.appeal_reason && (
              <div>
                <h2 className="font-semibold text-orange-600">Appeal Reason:</h2>
                <p>{agreement.appeal_reason}</p>
                <p className="text-sm">{agreement.appeal_details}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}