'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center h-16 justify-between">
        <Link
          href="/"
          className="text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent shrink-0"
        >
          Accordiax
        </Link>

        <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
          <Link
            href="/how-it-works"
            className={`text-sm font-medium transition-colors ${
              scrolled
                ? 'text-slate-600 hover:text-indigo-600'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            How it works
          </Link>
          <Link
            href="/login"
            className={`text-sm font-medium transition-colors ${
              scrolled
                ? 'text-slate-600 hover:text-indigo-600'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            For consultants
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className={`text-sm font-semibold px-3 py-2 transition-colors ${
              scrolled
                ? 'text-slate-700 hover:text-indigo-600'
                : 'text-indigo-200 hover:text-white'
            }`}
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            Get started
          </Link>
        </div>

        <button
          className={`md:hidden p-2 rounded-lg transition-colors ${
            scrolled
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-indigo-200 hover:text-white hover:bg-indigo-800/40'
          }`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 pb-4 space-y-1">
          <Link
            href="/how-it-works"
            className="block text-sm font-medium text-slate-700 hover:text-indigo-600 py-2.5 border-b border-slate-100"
            onClick={() => setMenuOpen(false)}
          >
            How it works
          </Link>
          <Link
            href="/login"
            className="block text-sm font-medium text-slate-700 hover:text-indigo-600 py-2.5 border-b border-slate-100"
            onClick={() => setMenuOpen(false)}
          >
            For consultants
          </Link>
          <div className="flex gap-3 pt-3">
            <Link
              href="/login"
              className="flex-1 text-center text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl py-2.5 hover:bg-slate-50 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="flex-1 text-center text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl py-2.5 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
