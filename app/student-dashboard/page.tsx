'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Request {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_range: string;
  status: string;
  created_at: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'project_supervision',
    budget_range: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const getUserAndRequests = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/login');
        return;
      }
      setUserEmail(user.email || null);

      // Fetch profile for full name and role (safety)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();

      // Safety redirect: if no role, go to role selection
      if (profileError || !profile?.role) {
        router.push('/role-selection');
        return;
      }

      if (profile?.full_name) setUserName(profile.full_name);
      else setUserName(user.email || null);

      // Fetch student's requests
      const { data, error: reqError } = await supabase
        .from('requests')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (reqError) console.error(reqError);
      else setRequests(data || []);
      setLoading(false);
    };
    getUserAndRequests();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in');
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from('requests').insert({
      student_id: user.id,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      budget_range: formData.budget_range || null,
      status: 'open',
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setShowModal(false);
      setFormData({ title: '', description: '', category: 'project_supervision', budget_range: '' });
      // Refresh requests
      const { data, error: refreshError } = await supabase
        .from('requests')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });
      if (!refreshError) setRequests(data || []);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-900">Accordiax</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{userName || userEmail}</span>
            <button onClick={handleLogout} className="text-red-600 text-sm hover:underline">Logout</button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">My Requests</h2>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl"
            >
              + New Request
            </button>
          </div>

          {requests.length === 0 ? (
            <p className="text-gray-600">You haven't posted any requests yet.</p>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="border border-gray-300 rounded-xl p-4 hover:shadow transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{req.title}</h3>
                      <p className="text-gray-700 text-sm mt-1">{req.description}</p>
                      <div className="flex gap-3 mt-2 text-xs text-gray-600">
                        <span>Category: {req.category.replace('_', ' ')}</span>
                        {req.budget_range && <span>Budget: {req.budget_range}</span>}
                        <span>Status: <span className="capitalize">{req.status}</span></span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(req.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Create a new request</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="title"
                placeholder="Title (e.g., Help with final year project)"
                className="w-full p-2 border border-gray-300 rounded mb-3 text-gray-800 placeholder-gray-500"
                value={formData.title}
                onChange={handleChange}
                required
              />
              <textarea
                name="description"
                placeholder="Describe what you need help with..."
                className="w-full p-2 border border-gray-300 rounded mb-3 text-gray-800 placeholder-gray-500"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                required
              />
              <select
                name="category"
                className="w-full p-2 border border-gray-300 rounded mb-3 text-gray-800"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="project_supervision">Project Supervision</option>
                <option value="admission_guidance">Admission Guidance</option>
                <option value="assignment_support">Assignment Support</option>
              </select>
              <input
                type="text"
                name="budget_range"
                placeholder="Budget range (optional, e.g., ₦5,000 - ₦10,000)"
                className="w-full p-2 border border-gray-300 rounded mb-4 text-gray-800 placeholder-gray-500"
                value={formData.budget_range}
                onChange={handleChange}
              />
              {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded disabled:opacity-50">
                  {submitting ? 'Posting...' : 'Post Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}