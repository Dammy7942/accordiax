import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-20 text-center">
        {/* Fixed gradient heading */}
        <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-fade-in">
          Accordiax
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 mt-4 animate-slide-up">
          Trust through structured agreements.
        </p>
        <p className="text-slate-500 max-w-2xl mx-auto mt-6">
          No more paying and getting nothing. Define scope, timeline, and deliverables <strong className="text-blue-700">before</strong> you pay.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link href="/login">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg">
              Get Started
            </button>
          </Link>
          <Link href="/how-it-works">
            <button className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium px-8 py-3 rounded-xl shadow-sm transition-all duration-200">
              Learn More
            </button>
          </Link>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 p-6 transition hover:shadow-md hover:-translate-y-1">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="font-bold text-lg text-slate-800">1. Agreement First</h3>
            <p className="text-slate-500 text-sm">Define terms before money changes hands.</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 p-6 transition hover:shadow-md hover:-translate-y-1">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="font-bold text-lg text-slate-800">2. Secure Payment</h3>
            <p className="text-slate-500 text-sm">Pay only after both parties sign.</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 p-6 transition hover:shadow-md hover:-translate-y-1">
            <div className="text-4xl mb-3">⭐</div>
            <h3 className="font-bold text-lg text-slate-800">3. Trust & Ratings</h3>
            <p className="text-slate-500 text-sm">Build reputation through completed work.</p>
          </div>
        </div>
      </div>
    </div>
  );
}