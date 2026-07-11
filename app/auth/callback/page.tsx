'use client';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { BrandedLoader } from '@/components/BrandedLoader';

export default function CallbackPage() {
  useAuthRedirect(true);
  return <BrandedLoader message="Signing you in..." />;
}
