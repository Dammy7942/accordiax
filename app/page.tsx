import Link from 'next/link';
import { MarketingNav } from '@/components/MarketingNav';
import { FadeIn } from '@/components/FadeIn';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const revalidate = 3600;

/* ── Server-side stat queries ─────────────────────────────────────────────── */

interface SiteStats {
  completedAgreements: number;
  universities: number;
  avgRating: string | null;
  consultants: number;
}

async function getStats(): Promise<SiteStats> {
  try {
    const [
      { count: completedCount },
      { data: profileData },
      { data: ratingRows },
      { count: consultantCount },
    ] = await Promise.all([
      supabaseAdmin
        .from('agreements')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed'),
      supabaseAdmin
        .from('profiles')
        .select('university')
        .not('university', 'is', null)
        .neq('university', ''),
      supabaseAdmin
        .from('agreements')
        .select('rating')
        .not('rating', 'is', null),
      supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'consultant'),
    ]);

    const uniqueUniversities = profileData
      ? new Set(profileData.map((p) => p.university).filter(Boolean)).size
      : 0;

    const avgRating =
      ratingRows && ratingRows.length > 0
        ? (
            ratingRows.reduce((sum, r) => sum + (r.rating as number), 0) /
            ratingRows.length
          ).toFixed(1)
        : null;

    return {
      completedAgreements: completedCount ?? 0,
      universities: uniqueUniversities,
      avgRating,
      consultants: consultantCount ?? 0,
    };
  } catch {
    return { completedAgreements: 0, universities: 0, avgRating: null, consultants: 0 };
  }
}

/* ── Local illustration components ───────────────────────────────────────── */

function HeroIllustration() {
  return (
    <div className="relative w-full max-w-xs mx-auto lg:mx-0">
      <div className="absolute -bottom-3 -right-3 w-full h-full bg-indigo-500/20 rounded-2xl" />
      <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-indigo-600 px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-indigo-200 text-xs font-medium">Agreement no. 2024-0847</span>
            <span className="bg-green-400 text-green-900 text-xs font-bold px-2.5 py-0.5 rounded-full">Active</span>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">AO</div>
              <div className="w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">ES</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700">Adaeze O. and Dr. Emeka S.</div>
              <div className="text-xs text-slate-400">Thesis Supervision</div>
            </div>
          </div>
          <div className="border-t border-slate-100" />
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Scope</span>
              <span className="text-slate-700 font-medium">Literature review</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Timeline</span>
              <span className="text-slate-700 font-medium">6 weeks</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Deadline</span>
              <span className="text-slate-700 font-medium">30 July 2025</span>
            </div>
          </div>
          <div className="border-t border-slate-100" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Held in escrow</div>
              <div className="text-xl font-extrabold text-slate-900">NGN 45,000</div>
            </div>
            <div className="bg-indigo-50 rounded-xl p-2.5">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <div className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl text-center select-none">
            Release payment
          </div>
        </div>
      </div>
    </div>
  );
}

function AgreementIllustration() {
  return (
    <div className="w-full max-w-[260px] mx-auto transition-transform duration-300 hover:scale-[1.03]">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 hover:shadow-2xl transition-shadow duration-300">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-slate-800">Agreement Terms</div>
            <div className="text-xs text-slate-400">Both parties signed</div>
          </div>
          <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div className="space-y-2 mb-5">
          <div className="h-2 bg-slate-100 rounded-full w-full" />
          <div className="h-2 bg-slate-100 rounded-full w-4/5" />
          <div className="h-2 bg-slate-100 rounded-full w-full" />
          <div className="h-2 bg-slate-100 rounded-full w-3/5" />
          <div className="h-2 bg-slate-100 rounded-full w-full" />
        </div>
        <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
          <div>
            <div className="h-px bg-slate-300 mb-1.5" />
            <div className="text-xs text-slate-400">Student</div>
            <div className="text-xs text-indigo-600 font-semibold mt-0.5">Signed</div>
          </div>
          <div>
            <div className="h-px bg-slate-300 mb-1.5" />
            <div className="text-xs text-slate-400">Consultant</div>
            <div className="text-xs text-indigo-600 font-semibold mt-0.5">Signed</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EscrowIllustration() {
  return (
    <div className="w-full max-w-[260px] mx-auto space-y-2.5 transition-transform duration-300 hover:scale-[1.02]">
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow duration-200">
        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-700">Student pays NGN 45,000</div>
          <div className="text-xs text-slate-400">Funds leave student account</div>
        </div>
      </div>
      <div className="flex justify-center">
        <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-4 flex items-center gap-3 hover:shadow-md transition-shadow duration-200">
        <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <div className="text-xs font-semibold text-indigo-700">Accordiax holds funds</div>
          <div className="text-xs text-indigo-400">Safe until work is confirmed</div>
        </div>
      </div>
      <div className="flex justify-center">
        <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow duration-200">
        <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-700">Consultant receives payment</div>
          <div className="text-xs text-slate-400">After student approves the work</div>
        </div>
      </div>
    </div>
  );
}

function DisputeIllustration() {
  return (
    <div className="w-full max-w-[280px] mx-auto transition-transform duration-300 hover:scale-[1.03]">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 hover:shadow-2xl transition-shadow duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-slate-800">Dispute Review</div>
            <div className="text-xs text-slate-400">Admin review in progress</div>
          </div>
          <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">Open</span>
        </div>
        <div className="space-y-2 mb-4">
          <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-2.5">
            <div className="w-5 h-5 bg-indigo-100 rounded flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xs text-slate-600 flex-1">Original agreement reviewed</span>
            <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-2.5">
            <div className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <span className="text-xs text-slate-600 flex-1">Both parties heard</span>
            <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2.5">
            <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs text-blue-600 font-semibold flex-1">Verdict pending</span>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-center">
          <span className="text-xs text-amber-700 font-medium">Funds locked until resolution</span>
        </div>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default async function HomePage() {
  const stats = await getStats();

  const statItems = [
    {
      value: stats.completedAgreements.toString(),
      label: 'Agreements completed',
    },
    {
      value: stats.universities > 0 ? `${stats.universities}+` : '0',
      label: 'Universities represented',
    },
    {
      value: stats.avgRating ?? 'N/A',
      label: 'Average consultant rating',
    },
    {
      value: stats.consultants.toString(),
      label: 'Verified consultants',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 pt-28 pb-20 lg:pt-32 lg:pb-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-32 w-[500px] h-[500px] bg-indigo-500 rounded-full opacity-10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="animate-fade-in">
              <span className="inline-block bg-indigo-500/20 text-indigo-200 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-indigo-500/30">
                Structured academic consulting
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
                Academic consulting<br />
                <span className="text-indigo-300">built on written agreements</span>
              </h1>
              <p className="mt-6 text-lg text-indigo-100 leading-relaxed max-w-lg animate-slide-up">
                Post your request, agree on scope and price, and pay into escrow. Your funds are protected until you confirm the work is complete.
              </p>
              <div className="mt-8 flex gap-3 animate-slide-up">
                <Link
                  href="/login"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-semibold px-5 py-3 sm:px-6 rounded-xl shadow-md hover:shadow-xl hover:bg-indigo-50 hover:-translate-y-0.5 transition-all duration-200 text-sm"
                >
                  Get started free
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/how-it-works"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border border-indigo-400/40 text-indigo-200 font-semibold px-5 py-3 sm:px-6 rounded-xl hover:bg-indigo-800/40 hover:border-indigo-300/60 transition-all duration-200 text-sm"
                >
                  See how it works
                </Link>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end animate-fade-in">
              <div className="animate-float">
                <HeroIllustration />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof strip ── */}
      <section className="py-12 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {statItems.map((item, i) => (
              <FadeIn key={item.label} delay={i * 80}>
                <AnimatedCounter value={item.value} label={item.label} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              From request to result, in three steps
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto mb-16">
              Every engagement follows the same structured process, so both parties know exactly what to expect.
            </p>
          </FadeIn>

          <div className="relative grid md:grid-cols-3 gap-8">
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-indigo-100" />
            {[
              {
                n: '1',
                title: 'Post your request',
                body: 'Describe what you need, your budget, and your deadline. Consultants who match your request will respond with a formal offer.',
              },
              {
                n: '2',
                title: 'Agree on a written offer',
                body: "Review the consultant's proposal. Scope, price, timeline, and deliverables are locked in writing before anything moves forward.",
              },
              {
                n: '3',
                title: 'Pay safely, then confirm',
                body: 'Pay into escrow once you accept the offer. Funds are released to the consultant only after you confirm the work is complete.',
              },
            ].map((step, i) => (
              <FadeIn key={step.n} delay={i * 120} direction="up">
                <div className="relative z-10 flex flex-col items-center text-center group">
                  <div className="w-16 h-16 bg-indigo-600 text-white text-xl font-extrabold rounded-full flex items-center justify-center mb-6 shadow-lg ring-4 ring-indigo-50 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                    {step.n}
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={400} className="mt-12">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 border border-indigo-200 text-indigo-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 hover:-translate-y-0.5 transition-all duration-200 text-sm"
            >
              Read the full walkthrough
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-24">

          {/* Feature 1 */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <FadeIn direction="left">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Written agreements</p>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4 leading-tight">
                Every engagement starts with a signed agreement
              </h2>
              <p className="text-slate-500 leading-relaxed mb-4">
                Scope, price, timeline, and deliverables are defined in writing before any payment is made. There is no room for misinterpretation or last-minute changes to the terms.
              </p>
              <p className="text-slate-500 leading-relaxed">
                Both parties must accept the terms before the agreement goes live. Neither side can change the scope unilaterally once it is signed.
              </p>
            </FadeIn>
            <FadeIn direction="right">
              <AgreementIllustration />
            </FadeIn>
          </div>

          {/* Feature 2 */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <FadeIn direction="left" className="md:order-2">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-500 mb-3">Escrow payment</p>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4 leading-tight">
                Your payment is held safely until you approve
              </h2>
              <p className="text-slate-500 leading-relaxed mb-4">
                When you pay, the funds go into escrow, not directly to the consultant. The consultant knows the money is there, confirmed and ready, so work begins without hesitation.
              </p>
              <p className="text-slate-500 leading-relaxed">
                You release the payment only after you have reviewed the work and confirmed it meets the agreed terms. If it does not, you raise a dispute before releasing.
              </p>
            </FadeIn>
            <FadeIn direction="right" className="md:order-1">
              <EscrowIllustration />
            </FadeIn>
          </div>

          {/* Feature 3 */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <FadeIn direction="left">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-3">Dispute resolution</p>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4 leading-tight">
                Impartial resolution when things go wrong
              </h2>
              <p className="text-slate-500 leading-relaxed mb-4">
                If a dispute arises, our admin team reviews the original agreement and the work delivered, then makes a fair determination based solely on the written terms.
              </p>
              <p className="text-slate-500 leading-relaxed">
                Neither party can walk away with the escrowed funds unilaterally. The process is transparent, documented, and fair to both sides.
              </p>
            </FadeIn>
            <FadeIn direction="right">
              <DisputeIllustration />
            </FadeIn>
          </div>

        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 bg-indigo-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">What users say</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Trusted by students and consultants
            </h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'I finally felt confident paying upfront because the agreement covered every single detail. I knew exactly what I was getting and when I was getting it.',
                name: 'Adaeze O.',
                role: 'Student, University of Lagos',
                initials: 'AO',
                color: 'bg-indigo-500',
              },
              {
                quote: 'My clients are clearer about what they need, and I get paid promptly. The structured agreement removes all the back-and-forth before we even start.',
                name: 'Dr. Emeka S.',
                role: 'Senior Academic Consultant',
                initials: 'ES',
                color: 'bg-purple-500',
              },
              {
                quote: 'When a disagreement came up, the admin team resolved it fairly and quickly. I would never go back to informal arrangements after this experience.',
                name: 'Fatima K.',
                role: 'Student, Ahmadu Bello University',
                initials: 'FK',
                color: 'bg-blue-500',
              },
            ].map((t, i) => (
              <FadeIn key={t.name} delay={i * 100}>
                <div className="bg-indigo-900/50 border border-indigo-800/60 rounded-2xl p-6 flex flex-col gap-4 hover:bg-indigo-800/60 hover:-translate-y-1 transition-all duration-300 cursor-default h-full">
                  <p className="text-indigo-100 text-sm leading-relaxed flex-1">&#8220;{t.quote}&#8221;</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">{t.name}</div>
                      <div className="text-indigo-400 text-xs">{t.role}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dual CTA ── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Ready to work without the worry?
            </h2>
            <p className="text-slate-500 max-w-md mx-auto mb-12">
              Create a free account and post your first request in under two minutes.
            </p>
          </FadeIn>
          <div className="grid sm:grid-cols-2 gap-6 max-w-xl mx-auto">
            <FadeIn delay={80} direction="left">
              <Link href="/login" className="group block h-full">
                <div className="border-2 border-indigo-100 hover:border-indigo-300 rounded-2xl p-8 text-center transition-all hover:shadow-lg hover:-translate-y-1 duration-300 h-full flex flex-col">
                  <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200 group-hover:scale-110 transition-all duration-300">
                    <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">I am a student</h3>
                  <p className="text-slate-500 text-sm leading-relaxed flex-1">Post requests and receive structured offers from verified academic consultants.</p>
                  <div className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl text-center transition-colors duration-200">
                    Post a request
                  </div>
                </div>
              </Link>
            </FadeIn>
            <FadeIn delay={160} direction="right">
              <Link href="/login" className="group block h-full">
                <div className="border-2 border-purple-100 hover:border-purple-300 rounded-2xl p-8 text-center transition-all hover:shadow-lg hover:-translate-y-1 duration-300 h-full flex flex-col">
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 group-hover:scale-110 transition-all duration-300">
                    <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">I am a consultant</h3>
                  <p className="text-slate-500 text-sm leading-relaxed flex-1">Browse open requests and send structured proposals to students who need your expertise.</p>
                  <div className="mt-5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold py-2.5 rounded-xl text-center transition-colors duration-200">
                    Browse requests
                  </div>
                </div>
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
            <div>
              <div className="text-white font-bold text-lg mb-2">Accordiax</div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Trust through structured agreements. Academic consulting, done right.
              </p>
            </div>
            <div>
              <div className="text-slate-300 font-semibold text-sm mb-4">Product</div>
              <ul className="space-y-2 text-sm">
                <li><Link href="/how-it-works" className="hover:text-white transition-colors">How it works</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">For consultants</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">For students</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-slate-300 font-semibold text-sm mb-4">Account</div>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white transition-colors">Log in</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Create account</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-slate-600">
            <span>2025 Accordiax. All rights reserved.</span>
            <Link href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
