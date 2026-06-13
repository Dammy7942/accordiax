import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  console.log('=== Release API called ===');
  try {
    const { agreementId } = await request.json();
    console.log('agreementId:', agreementId);
    if (!agreementId) {
      return NextResponse.json({ error: 'Missing agreementId' }, { status: 400 });
    }

    // Fetch agreement
    const { data: agreement, error: fetchError } = await supabaseAdmin
      .from('agreements')
      .select('id, price, paystack_ref, status, payment_released, consultant_id')
      .eq('id', agreementId)
      .single();
    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }
    console.log('Agreement found:', agreement);

    // Check status
    if (agreement.status !== 'completed') {
      return NextResponse.json({ error: 'Agreement not completed by student' }, { status: 400 });
    }
    if (agreement.payment_released) {
      return NextResponse.json({ error: 'Payment already released' }, { status: 400 });
    }

    // Update to mark payment released
    const { error: updateError } = await supabaseAdmin
      .from('agreements')
      .update({ payment_released: true })
      .eq('id', agreementId);
    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    console.log('Payment released successfully');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Release API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}