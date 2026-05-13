import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { reference, agreementId } = await request.json();
    console.log('Verification called', { reference, agreementId });

    if (!reference || !agreementId) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    // Get the access token from the Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      console.error('No authorization token provided');
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Create a Supabase client with the user's access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    console.log('Authenticated user ID:', user.id);

    // Fetch the agreement and verify ownership (student must own the request)
    const { data: agreement, error: agreeError } = await supabase
      .from('agreements')
      .select('request_id, status')
      .eq('id', agreementId)
      .single();

    if (agreeError || !agreement) {
      return NextResponse.json({ success: false, message: 'Agreement not found' }, { status: 404 });
    }

    if (agreement.status !== 'accepted') {
      return NextResponse.json({ success: false, message: 'Agreement already processed' }, { status: 400 });
    }

    const { data: requestData, error: reqError } = await supabase
      .from('requests')
      .select('student_id')
      .eq('id', agreement.request_id)
      .single();

    if (reqError || requestData.student_id !== user.id) {
      return NextResponse.json({ success: false, message: 'Not authorized to pay this agreement' }, { status: 403 });
    }

    // Verify payment with Paystack
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.error('PAYSTACK_SECRET_KEY not set');
      return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
    }

    const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;
    const paystackRes = await fetch(verifyUrl, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });
    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      console.error('Paystack verification failed', paystackData);
      return NextResponse.json({ success: false, message: 'Payment verification failed' }, { status: 400 });
    }

    // Update agreement status to 'paid'
    const { error: updateError } = await supabase
      .from('agreements')
      .update({ status: 'paid' })
      .eq('id', agreementId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({ success: false, message: 'Database update failed' }, { status: 500 });
    }

    // Insert transaction record (optional)
    const { error: insertError } = await supabase.from('transactions').insert({
      agreement_id: agreementId,
      paystack_ref: reference,
      amount: paystackData.data.amount / 100,
      status: 'success',
    });

    if (insertError) {
      console.warn('Transaction insert warning:', insertError.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Verification endpoint error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}