import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { agreementId, ruledForStudent, notes } = await request.json();
    if (!agreementId || ruledForStudent === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // ruledForStudent = true  → student wins → consultant found guilty → status: 'rejected'
    // ruledForStudent = false → consultant wins → student dispute rejected → status: 'completed'
    const { error: updateError } = await supabaseAdmin
      .from('agreements')
      .update({
        found_guilty: ruledForStudent,
        status: ruledForStudent ? 'rejected' : 'completed',
        resolution_notes: notes ?? null,
      })
      .eq('id', agreementId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Send email notifications to both parties
    const { data: agreement } = await supabaseAdmin
      .from('agreements')
      .select('consultant_id, request_id')
      .eq('id', agreementId)
      .single();

    if (agreement) {
      const { data: requestRow } = await supabaseAdmin
        .from('requests')
        .select('student_id')
        .eq('id', agreement.request_id)
        .single();

      const outcome = ruledForStudent
        ? 'The dispute was ruled in the student\'s favour. The agreement has been rejected and the escrow will be reviewed for refund.'
        : 'The dispute was not upheld. The agreement has been marked complete and payment will be released to the consultant.';

      const htmlContent = `<p>An admin has resolved a dispute on your agreement.</p><p>${outcome}</p>${notes ? `<p><strong>Admin notes:</strong> ${notes}</p>` : ''}<p>If you disagree with this ruling, you may submit an appeal from your dashboard.</p>`;

      const userIds = [requestRow?.student_id, agreement.consultant_id].filter(Boolean);
      await Promise.all(
        userIds.map(async (userId) => {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId!);
          const email = userData?.user?.email;
          if (email) {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: email,
                subject: 'Dispute resolved',
                htmlContent,
              }),
            });
          }
        })
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
