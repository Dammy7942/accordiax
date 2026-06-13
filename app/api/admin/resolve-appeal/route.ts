import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { agreementId, guilty, notes } = await request.json();

    const { error: updateError } = await supabaseAdmin
      .from('agreements')
      .update({
        found_guilty: guilty,
        status: guilty ? 'rejected' : 'completed',
        resolution_notes: notes,
      })
      .eq('id', agreementId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Fetch party IDs for email notifications
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

      const resultText = guilty
        ? 'found guilty – agreement rejected'
        : 'found not guilty – agreement completed';
      const htmlContent = `<p>The admin has resolved the appeal: ${resultText}.</p><p>Resolution notes: ${notes}</p>`;

      const userIds = [requestRow?.student_id, agreement.consultant_id].filter(Boolean);
      await Promise.all(
        userIds.map(async (userId) => {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
          const email = userData?.user?.email;
          if (email) {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to: email, subject: 'Appeal resolved', htmlContent }),
            });
          }
        })
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('resolve-appeal error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
