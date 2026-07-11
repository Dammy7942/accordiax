import Link from 'next/link';
import { MarketingNav } from '@/components/MarketingNav';
import { FadeIn } from '@/components/FadeIn';

const detailedSteps = [
  {
    n: '1',
    title: 'Student posts a request',
    body: 'Describe exactly what you need: project supervision, admission guidance, essay review, or any other academic consulting service. Include your budget and your deadline. Your request is visible to consultants who are qualified to help.',
    accent: 'bg-indigo-600',
    ring: 'ring-indigo-50',
  },
  {
    n: '2',
    title: 'Consultant sends a structured offer',
    body: 'A consultant who can help responds with a formal proposal. The proposal specifies the scope of work, the price, the timeline, and exactly what you will receive as a deliverable. Nothing is left vague.',
    accent: 'bg-purple-600',
    ring: 'ring-purple-50',
  },
  {
    n: '3',
    title: 'Both parties sign the agreement',
    body: 'You review the proposal and accept or request changes. Once both parties confirm the terms, a binding agreement is created. Neither side can change the scope, price, or timeline after signing without mutual consent.',
    accent: 'bg-blue-600',
    ring: 'ring-blue-50',
  },
  {
    n: '4',
    title: 'Student pays into escrow',
    body: 'After signing, you make payment. The funds go into escrow on Accordiax, not directly to the consultant. The consultant can see that payment has been confirmed, so they can begin work immediately with full confidence.',
    accent: 'bg-indigo-600',
    ring: 'ring-indigo-50',
  },
  {
    n: '5',
    title: 'Work is delivered and payment is released',
    body: 'The consultant submits the completed work. You review it against the agreed terms. If you are satisfied, you release the payment and both parties can leave a rating. If there is an issue, you raise a dispute and our admin team reviews the case.',
    accent: 'bg-green-600',
    ring: 'ring-green-50',
  },
];

const trustPoints = [
  {
    title: 'No payment without a signature',
    body: 'The platform blocks payment until both parties have signed the agreement.',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Funds released only on approval',
    body: 'Escrow holds your payment until you confirm the work meets the agreed terms.',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: 'Fair disputes, every time',
    body: 'Our admin team reviews all disputes against the original signed agreement.',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 pt-28 pb-20 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-32 w-[500px] h-[500px] bg-indigo-500 rounded-full opacity-10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl" />
        </div>
        <FadeIn className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block bg-indigo-500/20 text-indigo-200 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-indigo-500/30">
            The full walkthrough
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            How Accordiax works
          </h1>
          <p className="text-indigo-200 text-lg max-w-xl mx-auto leading-relaxed">
            Five steps from first request to final payment, with every term in writing and your money protected throughout.
          </p>
        </FadeIn>
      </section>

      {/* 3-step overview */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">The process</p>
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
        </div>
      </section>

      {/* Detailed walkthrough */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Step by step</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
              The complete picture
            </h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Here is exactly what happens at each stage of an engagement on Accordiax.
            </p>
          </FadeIn>
          <div className="relative">
            <div className="hidden sm:block absolute left-8 top-8 bottom-8 w-px bg-indigo-100" />
            <div className="space-y-10">
              {detailedSteps.map((step, i) => (
                <FadeIn key={step.n} delay={i * 80} direction="left">
                  <div className="relative flex gap-6 sm:gap-8 group">
                    <div
                      className={`shrink-0 w-16 h-16 ${step.accent} text-white text-xl font-extrabold rounded-full flex items-center justify-center shadow-md ring-4 ${step.ring} relative z-10 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}
                    >
                      {step.n}
                    </div>
                    <div className="flex-1 pt-3 pb-2">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Why it works</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
              Built for trust on both sides
            </h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Every feature on Accordiax is designed to protect both students and consultants equally.
            </p>
          </FadeIn>
          <div className="grid sm:grid-cols-3 gap-6">
            {trustPoints.map((item, i) => (
              <FadeIn key={item.title} delay={i * 100}>
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <div className={`w-12 h-12 ${item.iconBg} ${item.iconColor} rounded-xl flex items-center justify-center mb-4`}>
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-2">{item.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{item.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Dual CTA */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Ready to get started?
            </h2>
            <p className="text-slate-500 max-w-md mx-auto mb-12">
              Create a free account and post your first request in under two minutes.
            </p>
          </FadeIn>
          <div className="grid sm:grid-cols-2 gap-6 max-w-xl mx-auto">
            <FadeIn delay={80} direction="left">
              <Link href="/login" className="group block h-full">
                <div className="bg-white border-2 border-indigo-100 hover:border-indigo-300 rounded-2xl p-8 text-center transition-all hover:shadow-lg hover:-translate-y-1 duration-300 h-full flex flex-col">
                  <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200 group-hover:scale-110 transition-all duration-300">
                    <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">I am a student</h3>
                  <p className="text-slate-500 text-sm leading-relaxed flex-1">Post requests and receive structured offers from verified academic consultants.</p>
                  <div className="mt-5 bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl text-center">
                    Post a request
                  </div>
                </div>
              </Link>
            </FadeIn>
            <FadeIn delay={160} direction="right">
              <Link href="/login" className="group block h-full">
                <div className="bg-white border-2 border-purple-100 hover:border-purple-300 rounded-2xl p-8 text-center transition-all hover:shadow-lg hover:-translate-y-1 duration-300 h-full flex flex-col">
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 group-hover:scale-110 transition-all duration-300">
                    <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">I am a consultant</h3>
                  <p className="text-slate-500 text-sm leading-relaxed flex-1">Browse open requests and send structured proposals to students who need your expertise.</p>
                  <div className="mt-5 bg-purple-600 text-white text-sm font-semibold py-2.5 rounded-xl text-center">
                    Browse requests
                  </div>
                </div>
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Footer */}
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
