import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Verification request body:', body);
    const { transaction_id, agreementId } = body;
    if (!transaction_id || !agreementId) {
      console.error('Missing parameters');
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secretKey) {
      console.error('FLUTTERWAVE_SECRET_KEY missing');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const verifyUrl = `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`;
    console.log('Verifying with Flutterwave:', verifyUrl);
    const response = await fetch(verifyUrl, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    console.log('Flutterwave verification response:', data);

    if (data.status !== 'success' || data.data.status !== 'successful') {
      console.error('Payment verification failed:', data);
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const updatePayload = {
      status: 'paid_held',
      transaction_ref: transaction_id,
      paid_at: new Date().toISOString(),
    };
    console.log('Updating agreement with:', updatePayload);
    const { error: updateError } = await supabase
      .from('agreements')
      .update(updatePayload)
      .eq('id', agreementId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    // Insert transaction record
    const { error: insertError } = await supabase.from('transactions').insert({
      agreement_id: agreementId,
      paystack_ref: transaction_id,
      amount: data.data.amount,
      status: 'success',
    });
    if (insertError) console.warn('Transaction insert warning:', insertError.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Verification error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}