'use client';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { BrandedLoader } from '@/components/BrandedLoader';

export default function AuthRedirect() {
  useAuthRedirect(false);
  return <BrandedLoader message="Signing you in..." />;
}
