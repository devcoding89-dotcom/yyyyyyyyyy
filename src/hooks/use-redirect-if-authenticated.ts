'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/supabase/provider';

export function useRedirectIfAuthenticated(redirectPath: string = '/') {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push(redirectPath);
    }
  }, [user, isLoading, router, redirectPath]);
}
