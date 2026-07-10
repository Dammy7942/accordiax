'use client';

interface BrandedLoaderProps {
  message?: string;
}

export function BrandedLoader({ message = 'Please wait...' }: BrandedLoaderProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 px-4">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <span className="absolute inset-0 rounded-full bg-indigo-400/20 animate-ping" style={{ animationDuration: '2s' }} />
          <span className="relative flex w-16 h-16 rounded-full bg-indigo-600/30 border border-indigo-500/40 items-center justify-center">
            <svg className="w-8 h-8 animate-spin" style={{ animationDuration: '1.6s' }} viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="rgb(99 102 241 / 0.3)" strokeWidth="2" />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="rgb(165 180 252)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </div>
        <p className="text-2xl font-extrabold bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-300 bg-clip-text text-transparent mb-2 tracking-tight">
          Accordiax
        </p>
        <p className="text-indigo-300/80 text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}
