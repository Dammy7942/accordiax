import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  console.log('=== PAYSTACK VERIFICATION STARTED ===');
  try {
    const { reference, agreementId } = await request.json();
    console.log('1. Verification called with reference:', reference, 'agreementId:', agreementId);

    if (!reference || !agreementId) {
      console.error('Missing parameters');
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    console.log('2. Authorization token present:', !!token);
    if (!token) {
      console.error('No authorization token provided');
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('3. Auth error:', userError);
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    console.log('4. Authenticated user ID:', user.id);

    const { data: agreement, error: agreeError } = await supabase
      .from('agreements')
      .select('request_id, status')
      .eq('id', agreementId)
      .single();

    if (agreeError || !agreement) {
      console.error('5. Agreement fetch error:', agreeError);
      return NextResponse.json({ success: false, message: 'Agreement not found' }, { status: 404 });
    }
    console.log('6. Agreement status:', agreement.status);

    if (agreement.status !== 'accepted') {
      console.log('7. Agreement already processed, status:', agreement.status);
      return NextResponse.json({ success: false, message: 'Agreement already processed' }, { status: 400 });
    }

    const { data: requestData, error: reqError } = await supabase
      .from('requests')
      .select('student_id')
      .eq('id', agreement.request_id)
      .single();

    if (reqError || requestData.student_id !== user.id) {
      console.error('8. Ownership check failed. Student ID:', requestData?.student_id, 'User ID:', user.id);
      return NextResponse.json({ success: false, message: 'Not authorized to pay this agreement' }, { status: 403 });
    }
    console.log('9. Ownership verified');

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.error('PAYSTACK_SECRET_KEY not set');
      return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
    }

    const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;
    const paystackRes = await fetch(verifyUrl, {
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
    });
    const paystackData = await paystackRes.json();
    console.log('10. Paystack verification response status:', paystackData.status);
    console.log('11. Transaction status:', paystackData.data?.status);

    if (!paystackData.status || paystackData.data.status !== 'success') {
      console.error('12. Paystack verification failed:', paystackData);
      return NextResponse.json({ success: false, message: 'Payment verification failed' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('agreements')
      .update({
        status: 'paid_held',
        paystack_ref: reference,
        paid_at: new Date().toISOString()
      })
      .eq('id', agreementId);

    if (updateError) {
      console.error('13. Database update error:', updateError);
      return NextResponse.json({ success: false, message: 'Database update failed' }, { status: 500 });
    }
    console.log('14. Agreement status updated to paid');

    const { error: insertError } = await supabase.from('transactions').insert({
      agreement_id: agreementId,
      paystack_ref: reference,
      amount: paystackData.data.amount / 100,
      status: 'success',
    });

    if (insertError) {
      console.warn('15. Transaction insert warning:', insertError.message);
    } else {
      console.log('16. Transaction record inserted');
    }

    console.log('=== VERIFICATION COMPLETED SUCCESSFULLY ===');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Verification endpoint error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}