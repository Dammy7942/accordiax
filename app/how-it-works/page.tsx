import Link from 'next/link';

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <Link href="/" className="text-blue-600 hover:underline mb-8 inline-block">← Back home</Link>
        <h1 className="text-4xl font-bold text-gray-800 mb-6">How Accordiax Works</h1>
        <div className="space-y-8">
          <div className="bg-gray-50 p-6 rounded-2xl">
            <div className="text-2xl font-bold text-blue-600 mb-2">1. Student posts a request</div>
            <p className="text-gray-600">Describe what you need – project supervision, admission guidance, etc.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl">
            <div className="text-2xl font-bold text-blue-600 mb-2">2. Consultant responds</div>
            <p className="text-gray-600">They propose scope, price, timeline, and deliverables.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl">
            <div className="text-2xl font-bold text-blue-600 mb-2">3. Agreement is signed</div>
            <p className="text-gray-600">Both parties confirm the terms – no ambiguity.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl">
            <div className="text-2xl font-bold text-blue-600 mb-2">4. Payment is made</div>
            <p className="text-gray-600">Only after the agreement is signed.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl">
            <div className="text-2xl font-bold text-blue-600 mb-2">5. Work delivered & confirmed</div>
            <p className="text-gray-600">Both parties mark completion – trust is maintained.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
