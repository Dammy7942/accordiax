'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'accordiax_admin_auth';

const navItems = [
  { label: 'Disputes', href: '/admin/disputes' },
  { label: 'Appeals', href: '/admin' },
  { label: 'Verification', href: '/admin/verification' },
  { label: 'Funds', href: '/admin/escrow' },
  { label: 'Reports', href: '/admin/reports' },
  { label: 'Payouts', href: '/admin/payouts' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [secret, setSecret] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored === process.env.NEXT_PUBLIC_ADMIN_SECRET) setAuthenticated(true);
    } catch {}
    setChecking(false);
  }, []);

  const login = () => {
    if (secret === process.env.NEXT_PUBLIC_ADMIN_SECRET) {
      sessionStorage.setItem(STORAGE_KEY, secret);
      setAuthenticated(true);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setAuthenticated(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Verifying session...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 w-full max-w-sm">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center mb-5">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Admin access</h1>
          <p className="text-sm text-slate-500 mb-6">Enter the admin secret to continue.</p>
          <input
            type="password"
            placeholder="Admin secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition mb-3"
            autoFocus
          />
          <button
            onClick={login}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            Log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <span className="font-bold text-sm tracking-tight">Accordiax Admin</span>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-white text-xs transition-colors"
            >
              Sign out
            </button>
          </div>
          <nav className="flex gap-1 -mb-px">
            {navItems.map((item) => {
              const active =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    active
                      ? 'border-indigo-400 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
