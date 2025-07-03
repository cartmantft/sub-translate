'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { logger } from '@/lib/utils/logger';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check for error messages in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
      let message = '로그인 중 오류가 발생했습니다.';
      
      switch (error) {
        case 'invalid_credentials':
        case 'invalid_grant':
          message = '이메일 또는 비밀번호가 올바르지 않습니다.';
          break;
        case 'email_not_confirmed':
          message = '이메일 인증이 필요합니다. 이메일을 확인해주세요.';
          break;
        case 'too_many_requests':
          message = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
          break;
        case 'signup_disabled':
          message = '현재 회원가입이 비활성화되어 있습니다.';
          break;
        case 'access_denied':
          message = '로그인이 취소되었습니다.';
          break;
        default:
          if (errorDescription) {
            message = process.env.NODE_ENV === 'development' 
              ? errorDescription 
              : '로그인 중 오류가 발생했습니다. 다시 시도해주세요.';
          }
      }
      
      setErrorMessage(message);
      logger.warn('Login error from URL params', undefined, { 
        component: 'LoginPage', 
        error, 
        errorDescription: process.env.NODE_ENV === 'development' ? errorDescription : '[masked]'
      });
      
      // Clean up URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push('/dashboard');
        }
      } catch (error) {
        logger.error('Session check failed', error, { component: 'LoginPage' });
      }
    };
    
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.debug('Auth state change', { 
          component: 'LoginPage', 
          event, 
          hasSession: !!session 
        });
        
        if (event === 'SIGNED_IN' && session) {
          setErrorMessage(null);
          router.push('/dashboard');
        } else if (event === 'SIGNED_OUT') {
          // Clear any existing error messages on sign out
          setErrorMessage(null);
        } else if (event === 'TOKEN_REFRESHED') {
          setErrorMessage(null);
        } else if (event === 'PASSWORD_RECOVERY') {
          setErrorMessage(null);
        }
      }
    );

    // Cleanup the listener when the component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  // Enhanced error handling for Auth UI component
  useEffect(() => {
    // Monitor auth state changes for error handling
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && !session) {
          // This usually indicates a failed sign-in attempt
          setErrorMessage('🚫 이메일 또는 비밀번호가 올바르지 않습니다.');
          logger.warn('Sign in failed - no session created', undefined, { 
            component: 'LoginPage', 
            event 
          });
        }
      }
    );

    // Simple fetch monitoring for auth errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Monitor Supabase auth endpoints
        const url = typeof args[0] === 'string' 
          ? args[0] 
          : args[0] instanceof URL 
            ? args[0].href 
            : args[0].url;
        if (url.includes('/auth/v1/token') && !response.ok) {
          // Use a timeout to ensure the error message shows after any Auth UI processing
          setTimeout(async () => {
            try {
              const errorData = await response.clone().json().catch(() => ({}));
              let message = '로그인 중 오류가 발생했습니다.';
              
              if (response.status === 400) {
                const errorText = errorData.error_description || errorData.message || '';
                
                if (errorText.includes('Invalid login credentials') || 
                    errorText.includes('invalid_grant')) {
                  message = '🚫 이메일 또는 비밀번호가 올바르지 않습니다.';
                } else if (errorText.includes('Email not confirmed')) {
                  message = '📧 이메일 인증이 필요합니다. 이메일을 확인해주세요.';
                } else if (errorText.includes('too many requests')) {
                  message = '⏰ 너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
                } else {
                  message = '❌ 로그인 정보를 확인해주세요.';
                }
              }
              
              // Force error message with multiple state updates to ensure visibility
              setErrorMessage(message);
              setTimeout(() => setErrorMessage(prev => prev ? message : message), 50);
              
              logger.error('Auth request failed', errorData, { 
                component: 'LoginPage',
                action: 'auth_request_error',
                status: response.status,
                errorDetails: process.env.NODE_ENV === 'development' ? errorData : '[masked]'
              });
            } catch (parseError) {
              logger.error('Error parsing auth error response', parseError, { component: 'LoginPage' });
            }
          }, 100);
        }
        
        return response;
      } catch (error) {
        if (typeof args[0] === 'string' && args[0].includes('/auth/v1/')) {
          setErrorMessage('🌐 네트워크 연결을 확인해주세요.');
          logger.error('Network error during auth', error, { component: 'LoginPage' });
        }
        throw error;
      }
    };
    
    return () => {
      authListener.subscription.unsubscribe();
      window.fetch = originalFetch;
    };
  }, [supabase]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              SubTranslate
            </h1>
          </Link>
          <p className="text-lg text-gray-600 leading-relaxed">
            계정에 로그인하여 AI 자막 생성 서비스를 시작하세요
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h2 className="text-2xl font-semibold text-white text-center">로그인</h2>
            <p className="text-blue-100 text-center mt-2">
              새 계정을 만들거나 기존 계정으로 로그인하세요
            </p>
          </div>

          {/* Card Content */}
          <div className="p-8">
            {/* Error Message - Enhanced visibility with forced rendering */}
            <div 
              className={`mb-6 transition-all duration-300 ${
                errorMessage 
                  ? 'opacity-100 max-h-96 p-4 bg-red-50 border-2 border-red-300 rounded-lg shadow-lg' 
                  : 'opacity-0 max-h-0 overflow-hidden'
              }`}
              style={{ 
                visibility: errorMessage ? 'visible' : 'hidden',
                display: errorMessage ? 'block' : 'none'
              }}
            >
              <div className="flex items-start">
                <svg className="w-7 h-7 text-red-500 mr-3 mt-0.5 flex-shrink-0 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <div className="bg-red-600 text-white text-sm font-bold px-2 py-1 rounded mb-2 inline-block animate-pulse">
                    ⚠️ 로그인 오류
                  </div>
                  <p className="text-red-800 text-base font-semibold leading-relaxed">
                    {errorMessage || '로그인 중 오류가 발생했습니다.'}
                  </p>
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="mt-3 inline-flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    닫기
                  </button>
                </div>
              </div>
            </div>

            <Auth
              supabaseClient={supabase}
              onlyThirdPartyProviders={false}
              appearance={{
                theme: ThemeSupa,
                style: {
                  button: {
                    background: 'linear-gradient(to right, #2563eb, #4f46e5)',
                    color: 'white',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    border: 'none',
                    transition: 'all 0.2s',
                  },
                  anchor: {
                    color: '#4f46e5',
                    textDecoration: 'none',
                    fontWeight: '500',
                  },
                  input: {
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s',
                  },
                  label: {
                    color: '#374151',
                    fontWeight: '500',
                    marginBottom: '0.5rem',
                  },
                  message: {
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    margin: '1rem 0',
                  },
                },
                variables: {
                  default: {
                    colors: {
                      brand: '#2563eb',
                      brandAccent: '#1d4ed8',
                      inputBackground: 'white',
                      inputBorder: '#d1d5db',
                      inputBorderHover: '#9ca3af',
                      inputBorderFocus: '#2563eb',
                    },
                    borderWidths: {
                      buttonBorderWidth: '0px',
                      inputBorderWidth: '1px',
                    },
                    radii: {
                      borderRadiusButton: '0.75rem',
                      buttonBorderRadius: '0.75rem',
                      inputBorderRadius: '0.5rem',
                    },
                  },
                },
              }}
              providers={['google', 'github']}
              redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback'}
              localization={{
                variables: {
                  sign_in: {
                    email_label: '이메일 주소',
                    password_label: '비밀번호',
                    button_label: '로그인',
                    loading_button_label: '로그인 중...',
                    social_provider_text: '{{provider}}로 계속하기',
                    link_text: '이미 계정이 있으신가요? 로그인',
                  },
                  sign_up: {
                    email_label: '이메일 주소',
                    password_label: '비밀번호',
                    button_label: '회원가입',
                    loading_button_label: '가입 중...',
                    social_provider_text: '{{provider}}로 가입하기',
                    link_text: '계정이 없으신가요? 회원가입',
                    confirmation_text: '확인 링크를 이메일로 확인해주세요',
                  },
                  forgotten_password: {
                    email_label: '이메일 주소',
                    button_label: '비밀번호 재설정 링크 전송',
                    loading_button_label: '전송 중...',
                    link_text: '비밀번호를 잊으셨나요?',
                    confirmation_text: '비밀번호 재설정 링크를 확인해주세요',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">SubTranslate로 할 수 있는 것들</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-xs text-gray-600 font-medium">비디오 업로드</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-xs text-gray-600 font-medium">AI 자막 생성</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <p className="text-xs text-gray-600 font-medium">다국어 번역</p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
