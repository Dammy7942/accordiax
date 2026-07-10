interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />;
}

export function AgreementCardSkeleton() {
  return (
    <div className="border border-slate-200 rounded-xl p-4 space-y-3">
      <Skeleton className="h-3.5 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-2/5" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4 sm:p-6 rounded-2xl border border-slate-200 bg-white/80">
      <Skeleton className="h-8 w-12" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}
