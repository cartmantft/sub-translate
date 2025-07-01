'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const supabase = createClient();

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
        console.error('Error getting session:', error);
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
    try {
      // Clear local state immediately
      setUser(null);
      
      // Call API endpoint to sign out and clear cookies
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      });
      
      if (!response.ok) {
        console.error('Failed to sign out');
      }
      
      // Force a complete page reload to clear all state
      window.location.href = '/';
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      // Still try to redirect even if there's an error
      window.location.href = '/';
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
              <Link 
                href="/dashboard" 
                className={`hover:text-blue-400 transition-colors ${
                  pathname === '/dashboard' ? 'text-blue-400' : ''
                }`}
              >
                대시보드
              </Link>
              <button 
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm font-medium"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              {pathname !== '/login' && (
                <Link 
                  href="/login" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
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
