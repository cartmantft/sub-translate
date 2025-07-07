'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';
import { useCsrfToken, fetchWithCsrf } from '@/hooks/useCsrfToken';

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();
  
  // CSRF token management for secure API requests
  const { getToken, error: csrfError } = useCsrfToken();

  useEffect(() => {
    let mounted = true;

    // Get initial auth state
    const initializeAuth = async () => {
      try {
        // Check if we have a session first
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        logger.error('Error getting session', error, { component: 'Navigation', action: 'initializeAuth' });
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSignOut = async () => {
    if (signingOut) return; // Prevent double-clicks
    
    try {
      setSigningOut(true);
      
      // Clear local state immediately for instant UI feedback
      setUser(null);
      
      // First, try to sign out via Supabase client (clears local session/tokens)
      const { error: supabaseError } = await supabase.auth.signOut();
      if (supabaseError) {
        logger.warn('Supabase signOut failed, continuing with API fallback', supabaseError, { component: 'Navigation', action: 'handleSignOut' });
      }
      
      // Get CSRF token for secure API request
      let response;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Logout timeout')), 5000)
      );
      
      try {
        const logoutPromise = async () => {
          if (csrfError) {
            logger.warn('CSRF system unavailable during signout, attempting without token', { component: 'Navigation', action: 'handleSignOut', csrfError });
            // Fallback to regular fetch if CSRF system is unavailable
            return fetch('/api/auth/signout', {
              method: 'POST',
            });
          } else {
            const csrfToken = await getToken();
            // Call API endpoint to sign out and clear cookies with CSRF protection
            return fetchWithCsrf('/api/auth/signout', {
              method: 'POST',
            }, csrfToken);
          }
        };
        
        response = await Promise.race([logoutPromise(), timeoutPromise]);
        
        if (!response.ok) {
          logger.error('API signout failed', undefined, { 
            component: 'Navigation', 
            action: 'handleSignOut',
            status: response.status,
            statusText: response.statusText
          });
        }
      } catch (error) {
        logger.error('Logout API call failed or timed out', error, { component: 'Navigation', action: 'handleSignOut' });
      }
      
      // Force a complete page reload to clear all state regardless of API call result
      window.location.href = '/';
    } catch (error) {
      logger.error('Unexpected error during sign out', error, { component: 'Navigation', action: 'handleSignOut' });
      // Fallback: try direct Supabase signOut and redirect
      try {
        await supabase.auth.signOut();
      } catch (fallbackError) {
        logger.error('Fallback signOut also failed', fallbackError, { component: 'Navigation', action: 'handleSignOut' });
      }
      // Still try to redirect even if there's an error
      window.location.href = '/';
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <nav className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 text-white shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            SubTranslate
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-20 h-6 bg-gray-700 rounded animate-pulse"></div>
            <div className="w-16 h-8 bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 text-white shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold hover:text-blue-400 transition-colors">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          SubTranslate
        </Link>
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <span className="text-sm text-gray-300">
                {user.email?.split('@')[0]}님
              </span>
              <Link 
                href="/" 
                className={`hover:text-blue-400 transition-colors ${
                  pathname === '/' ? 'text-blue-400' : ''
                }`}
              >
                홈
              </Link>
              <div className="relative group">
                <Link 
                  href="/dashboard" 
                  className={`hover:text-blue-400 transition-colors ${
                    pathname === '/dashboard' ? 'text-blue-400' : ''
                  }`}
                >
                  대시보드
                </Link>
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 whitespace-nowrap shadow-lg border border-gray-700">
                    <div className="font-medium mb-1">내 프로젝트 관리</div>
                    <div className="text-xs text-gray-300">저장된 자막 프로젝트를 확인하고 관리하세요</div>
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 border-t border-l border-gray-700 rotate-45"></div>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                disabled={signingOut}
                className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5 flex items-center gap-2 ${
                  signingOut 
                    ? 'bg-gray-500 cursor-not-allowed opacity-70'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                }`}
              >
                {signingOut ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    로그아웃 중...
                  </>
                ) : (
                  '로그아웃'
                )}
              </button>
            </>
          ) : (
            <>
              {pathname !== '/login' && (
                <Link 
                  href="/login" 
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  로그인
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}