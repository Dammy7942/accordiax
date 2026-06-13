import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { agreementId } = await request.json();
    if (!agreementId) return NextResponse.json({ error: 'Missing agreementId' }, { status: 400 });

    // 1. Get student ID via agreement and request
    const { data: agreement, error: aErr } = await supabaseAdmin
      .from('agreements')
      .select('request_id')
      .eq('id', agreementId)
      .single();
    if (aErr) return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });

    const { data: req, error: rErr } = await supabaseAdmin
      .from('requests')
      .select('student_id')
      .eq('id', agreement.request_id)
      .single();
    if (rErr) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    // 2. Get student email using Admin Auth API
    const { data: userData, error: uErr } = await supabaseAdmin.auth.admin.getUserById(req.student_id);
    if (uErr || !userData.user?.email) {
      return NextResponse.json({ error: 'Student email not found' }, { status: 404 });
    }
    const studentEmail = userData.user.email;

    // 3. Send email
    const success = await sendEmail(
      studentEmail,
      'Work delivered on Accordiax',
      `<p>Your consultant has marked the work as delivered. <a href="${process.env.NEXT_PUBLIC_APP_URL}/student-dashboard">Review now</a>.</p>`
    );
    if (!success) return NextResponse.json({ error: 'Email sending failed' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}