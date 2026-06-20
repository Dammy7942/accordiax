'use client';
import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  agreementId?: string;
}

export default function ReportModal({ isOpen, onClose, reportedUserId, agreementId }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submitReport = async () => {
    if (!reason) return alert('Please select a reason');
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let evidencePath = null;
    if (evidenceFile) {
      const fileExt = evidenceFile.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `report_evidence/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('report_evidence')
        .upload(filePath, evidenceFile);
      if (uploadError) {
        alert('Evidence upload failed: ' + uploadError.message);
        setSubmitting(false);
        return;
      }
      evidencePath = filePath;
    }

    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      agreement_id: agreementId || null,
      reason,
      details,
      evidence_url: evidencePath,
    });
    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Report submitted. Admin will review.');
      onClose();
    }
    setSubmitting(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report User">
      <div className="space-y-4">
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border rounded p-2">
          <option value="">Select reason</option>
          <option value="Fraud">Fraud / Scam</option>
          <option value="Harassment">Harassment</option>
          <option value="Inappropriate behavior">Inappropriate behavior</option>
          <option value="Other">Other</option>
        </select>
        <textarea
          placeholder="Additional details (optional)"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="w-full border rounded p-2"
          rows={3}
        />
        <div>
          <label className="block text-sm font-medium mb-1">Upload evidence (optional)</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
            className="w-full"
          />
        </div>
        <Button onClick={submitReport} loading={submitting}>Submit Report</Button>
      </div>
    </Modal>
  );
}