'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't interfere with the callback page
    if (pathname === '/auth/callback') {
      console.log('AuthProvider: Skipping auth check on callback page');
      return;
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      // Skip handling on callback page
      if (pathname === '/auth/callback') return;

      if (event === 'SIGNED_IN' && session) {
        // User signed in, redirect to dashboard if on auth pages
        if (pathname === '/login' || pathname === '/register') {
          console.log('Redirecting to dashboard after sign in');
          router.push('/dashboard');
        }
      } else if (event === 'SIGNED_OUT') {
        // User signed out, redirect to login
        if (!pathname.startsWith('/login') && !pathname.startsWith('/register') && pathname !== '/') {
          console.log('Redirecting to login after sign out');
          router.push('/login');
        }
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  return <>{children}</>;
}
