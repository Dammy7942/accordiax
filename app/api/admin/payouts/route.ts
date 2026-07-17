import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const { data: payRequests, error } = await supabaseAdmin
      .from('payment_requests')
      .select('id, amount, status, admin_notes, requested_at, processed_at, agreement_id, consultant_id, bank_account_id')
      .order('requested_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!payRequests || payRequests.length === 0) return NextResponse.json([]);

    const agreementIds = [...new Set(payRequests.map(r => r.agreement_id).filter(Boolean))];
    const consultantIds = [...new Set(payRequests.map(r => r.consultant_id).filter(Boolean))];
    const bankAccountIds = [...new Set(payRequests.map(r => r.bank_account_id).filter(Boolean))];

    const [
      { data: agreements },
      { data: profiles },
      { data: bankAccounts },
    ] = await Promise.all([
      supabaseAdmin.from('agreements').select('id, request_id').in('id', agreementIds),
      supabaseAdmin.from('profiles').select('id, full_name').in('id', consultantIds),
      supabaseAdmin.from('bank_accounts').select('id, bank_name, account_number, account_name').in('id', bankAccountIds),
    ]);

    const requestIds = [...new Set((agreements ?? []).map((a: any) => a.request_id).filter(Boolean))];
    const { data: requests } = await supabaseAdmin
      .from('requests')
      .select('id, title')
      .in('id', requestIds);

    const emailMap = new Map<string, string>();
    try {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      users.filter(u => consultantIds.includes(u.id)).forEach(u => emailMap.set(u.id, u.email ?? ''));
    } catch {}

    const requestMap = new Map((requests ?? []).map((r: any) => [r.id, r]));
    const agreementMap = new Map((agreements ?? []).map((a: any) => [a.id, { ...a, request: requestMap.get(a.request_id) }]));
    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const bankMap = new Map((bankAccounts ?? []).map((b: any) => [b.id, b]));

    const enriched = payRequests.map((req: any) => {
      const ag = agreementMap.get(req.agreement_id);
      const profile = profileMap.get(req.consultant_id);
      const bank = bankMap.get(req.bank_account_id);
      return {
        id: req.id,
        amount: req.amount,
        status: req.status,
        admin_notes: req.admin_notes,
        requested_at: req.requested_at,
        processed_at: req.processed_at,
        agreement: ag
          ? { id: ag.id, requests: ag.request ? { title: ag.request.title } : null }
          : null,
        consultant: profile
          ? { id: req.consultant_id, full_name: profile.full_name, email: emailMap.get(req.consultant_id) ?? null }
          : null,
        bank_account: bank
          ? { bank_name: bank.bank_name, account_number: bank.account_number, account_name: bank.account_name }
          : null,
      };
    });

    return NextResponse.json(enriched);
  } catch (err) {
    console.error('Payouts API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, status, admin_notes } = await request.json();
    if (!id || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('payment_requests')
      .update({
        status,
        admin_notes: admin_notes ?? null,
        processed_at: ['approved', 'rejected', 'paid'].includes(status) ? new Date().toISOString() : null,
      })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
