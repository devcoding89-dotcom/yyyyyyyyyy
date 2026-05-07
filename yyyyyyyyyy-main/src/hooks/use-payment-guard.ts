'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/lib/supabase/provider';
import { useDoc } from '@/hooks/use-supabase-doc';
import { useMemoSupabaseDoc } from '@/hooks/use-memo-supabase';

const PAYMENT_REQUIRED_PATHS = ['/dashboard', '/extract', '/contacts', '/templates', '/campaigns', '/send'];

export function usePaymentGuard() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const userProfileQuery = useMemoSupabaseDoc(
    {
      tableName: 'users',
      docId: user?.id || '',
    },
    [user]
  );

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileQuery);

  useEffect(() => {
    if (isLoading || isProfileLoading || !user) {
      return;
    }

    const requiresPayment = PAYMENT_REQUIRED_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    const expiration = profile?.subscription_expires_at || profile?.subscriptionExpiresAt;
    const isPaidActive =
      profile?.subscriptionTier === 'elite' &&
      (!expiration || new Date(expiration) > new Date());

    if (requiresPayment && !isPaidActive) {
      router.push('/pricing');
    }
  }, [user, isLoading, isProfileLoading, profile, pathname, router]);
}
