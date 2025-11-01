'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Auth callback page loaded');
        console.log('Current URL:', window.location.href);
        
        // Get URL parameters
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const errorParam = params.get('error');
        const errorDescription = params.get('error_description');
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');

        console.log('URL params:', { code, errorParam, errorDescription, accessToken });
        setDebugInfo(`Code: ${code ? 'present' : 'missing'}, Token: ${accessToken ? 'present' : 'missing'}`);

        // Handle OAuth errors
        if (errorParam) {
          console.error('OAuth error:', errorParam, errorDescription);
          setError(errorDescription || errorParam);
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        // Try to get existing session first
        console.log('Checking for existing session...');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('Session check result:', sessionData, sessionError);

        if (sessionData?.session) {
          console.log('✓ Session found, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }

        // If no session and we have a code, something went wrong
        if (code) {
          console.error('Code present but no session - Supabase should handle this automatically');
          setError('Authentication failed. Please try again.');
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        // No code and no session
        console.log('No code and no session, redirecting to login');
        setTimeout(() => router.push('/login'), 2000);
        
      } catch (error) {
        console.error('Callback handling error:', error);
        setError(error.message);
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    // Small delay to ensure URL is fully loaded
    const timeout = setTimeout(handleCallback, 100);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center max-w-md px-4">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing sign in...</h2>
            <p className="text-gray-600 mb-2">Please wait while we redirect you</p>
            {debugInfo && (
              <p className="text-xs text-gray-400 mt-4">{debugInfo}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
