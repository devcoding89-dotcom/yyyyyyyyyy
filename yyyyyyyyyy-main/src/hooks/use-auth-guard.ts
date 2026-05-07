
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/lib/supabase/provider';

const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password', '/pricing'];

export function useAuthGuard() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) {
      return; // Do nothing while loading
    }

    if (!user && !PUBLIC_PATHS.includes(pathname)) {
      router.push('/login');
    }
  }, [user, isLoading, router, pathname]);
}
