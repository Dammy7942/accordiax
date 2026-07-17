import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const { data: agreements, error: agreementsError } = await supabaseAdmin
      .from('agreements')
      .select('id, request_id, consultant_id, dispute_reason, dispute_details, dispute_raised_at, dispute_raised_by, status')
      .eq('status', 'disputed')
      .order('dispute_raised_at', { ascending: false });

    if (agreementsError) {
      return NextResponse.json({ error: agreementsError.message }, { status: 500 });
    }
    if (!agreements || agreements.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch request titles and student_ids
    const requestIds = agreements.map(a => a.request_id);
    const { data: requests } = await supabaseAdmin
      .from('requests')
      .select('id, title, student_id')
      .in('id', requestIds);
    const requestMap = new Map(requests?.map(r => [r.id, r]) ?? []);

    // Fetch profile names for both consultants and students in one batch
    const consultantIds = [...new Set(agreements.map(a => a.consultant_id))];
    const studentIds = [...new Set(requests?.map(r => r.student_id).filter(Boolean) ?? [])];
    const allIds = [...new Set([...consultantIds, ...studentIds])];

    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .in('id', allIds);
    const nameMap = new Map(profiles?.map(p => [p.id, p.full_name]) ?? []);

    // Fetch emails via admin auth API
    const emailMap = new Map<string, string>();
    try {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      users
        .filter(u => allIds.includes(u.id))
        .forEach(u => emailMap.set(u.id, u.email ?? ''));
    } catch {}

    const enriched = agreements.map(ag => {
      const req = requestMap.get(ag.request_id);
      return {
        ...ag,
        requests: req ? { title: req.title, student_id: req.student_id } : null,
        consultant: {
          full_name: nameMap.get(ag.consultant_id) ?? 'Unknown',
          email: emailMap.get(ag.consultant_id) ?? '',
        },
        student: req ? {
          full_name: nameMap.get(req.student_id) ?? 'Unknown',
          email: emailMap.get(req.student_id) ?? '',
        } : null,
      };
    });

    return NextResponse.json(enriched);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
