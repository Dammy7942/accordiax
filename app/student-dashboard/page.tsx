'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login');
      else setUserEmail(data.user.email || null);
    });
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-900">Accordiax</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{userEmail}</span>
            <button onClick={handleLogout} className="text-red-500 text-sm hover:underline">Logout</button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-2 text-gray-700">Student Dashboard</h2>
          <p className="text-gray-500 mb-6">Post a service request or track your agreements.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border rounded-xl p-4 hover:shadow transition">
              <div className="text-3xl mb-2">📢</div>
              <h3 className="font-bold text-gray-700">New Request</h3>
              <p className="text-sm text-gray-500">Post what you need help with.</p>
              <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Coming soon</button>
            </div>
            <div className="border rounded-xl p-4 hover:shadow transition">
              <div className="text-3xl mb-2">📋</div>
              <h3 className="font-bold text-gray-700">Active Agreements</h3>
              <p className="text-sm text-gray-500">Track ongoing work.</p>
              <button className="mt-3 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">Coming soon</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}