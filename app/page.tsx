import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-900 to-purple-800 bg-clip-text text-transparent">
            Accordiax
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mt-4">
            Trust through structured agreements.
          </p>
          <p className="text-gray-500 max-w-2xl mx-auto mt-6">
            No more paying consultants and getting nothing. Define scope, timeline, and deliverables – <strong className="text-blue-800">before</strong> you pay.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition"
            >
              Get Started
            </Link>
            <Link
              href="/how-it-works"
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold px-8 py-3 rounded-xl shadow-sm transition"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Feature preview */}
        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="font-bold text-lg text-gray-700">1. Agreement First</h3>
            <p className="text-gray-500 text-sm">Define scope, price, timeline before any payment.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-bold text-lg text-gray-700">2. Secure Payment</h3>
            <p className="text-gray-500 text-sm">Pay only after both parties sign.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="text-3xl mb-3">⭐</div>
            <h3 className="font-bold text-lg text-gray-700">3. Trust & Ratings</h3>
            <p className="text-gray-500 text-sm">Build reputation through completed work.</p>
          </div>
        </div>
      </div>
    </div>
  );
}