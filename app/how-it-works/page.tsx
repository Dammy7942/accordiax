import Link from 'next/link';
import { MarketingNav } from '@/components/MarketingNav';
import { FadeIn } from '@/components/FadeIn';

const steps = [
  {
    n: '1',
    title: 'Student posts a request',
    body: 'Describe exactly what you need: project supervision, admission guidance, essay review, or any other academic consulting service. Include your budget and your deadline. Your request is visible to consultants who are qualified to help.',
    accent: 'bg-indigo-600',
    ring: 'ring-indigo-100',
  },
  {
    n: '2',
    title: 'Consultant sends a structured offer',
    body: 'A consultant who can help responds with a formal proposal. The proposal specifies the scope of work, the price, the timeline, and exactly what you will receive as a deliverable. Nothing is vague.',
    accent: 'bg-purple-600',
    ring: 'ring-purple-100',
  },
  {
    n: '3',
    title: 'Both parties sign the agreement',
    body: 'You review the proposal and accept or request changes. Once both parties confirm the terms, a binding agreement is created. Neither side can change the scope, price, or timeline after signing without mutual consent.',
    accent: 'bg-blue-600',
    ring: 'ring-blue-100',
  },
  {
    n: '4',
    title: 'Student pays into escrow',
    body: 'After signing, you make payment. The funds go into escrow on Accordiax, not directly to the consultant. The consultant can see that payment has been confirmed, so they can begin work immediately with full confidence.',
    accent: 'bg-indigo-600',
    ring: 'ring-indigo-100',
  },
  {
    n: '5',
    title: 'Work is delivered and payment is released',
    body: 'The consultant submits the completed work. You review it against the agreed terms. If you are satisfied, you release the payment and both parties can leave a rating. If there is an issue, you raise a dispute and our admin team reviews the case.',
    accent: 'bg-green-600',
    ring: 'ring-green-100',
  },
];

const trustPoints = [
  {
    title: 'No payment without a signature',
    body: 'The platform blocks payment until both parties have signed the agreement.',
    icon: (
      <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Funds released only on approval',
    body: 'Escrow holds your payment until you confirm the work meets the agreed terms.',
    icon: (
      <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: 'Fair disputes, every time',
    body: 'Our admin team reviews all disputes against the original signed agreement.',
    icon: (
      <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Page header */}
      <section className="pt-28 pb-12 bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900">
        <FadeIn className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">The full walkthrough</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            How Accordiax works
          </h1>
          <p className="text-indigo-200 text-lg max-w-xl mx-auto leading-relaxed">
            Five steps from first request to final payment, with every term in writing and your money protected throughout.
          </p>
        </FadeIn>
      </section>

      {/* Steps */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="relative">
            <div className="hidden sm:block absolute left-8 top-8 bottom-8 w-px bg-slate-100" />
            <div className="space-y-10">
              {steps.map((step, i) => (
                <FadeIn key={step.n} delay={i * 80} direction="left">
                  <div className="relative flex gap-6 sm:gap-8 group">
                    <div
                      className={`shrink-0 w-16 h-16 ${step.accent} text-white text-xl font-extrabold rounded-full flex items-center justify-center shadow-md ${step.ring} ring-4 relative z-10 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}
                    >
                      {step.n}
                    </div>
                    <div className="flex-1 pt-3 pb-2">
                      <h2 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h2>
                      <p className="text-slate-500 leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust callout */}
      <section className="py-12 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {trustPoints.map((item, i) => (
              <FadeIn key={item.title} delay={i * 100}>
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex justify-center mb-3">{item.icon}</div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">{item.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{item.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white text-center">
        <FadeIn className="max-w-md mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
            Ready to get started?
          </h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Create a free account. Post your first request or browse open student requests in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm"
            >
              Create a free account
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-200 text-sm"
            >
              Back to home
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-600">
          <span className="text-slate-500 font-semibold text-sm">Accordiax</span>
          <span>2025 Accordiax. All rights reserved.</span>
          <Link href="/" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
