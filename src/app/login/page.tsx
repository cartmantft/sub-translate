'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // User just signed in, redirect to dashboard
          router.push('/dashboard');
        }
      }
    );

    // Cleanup the listener when the component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase]);

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
            <Auth
              supabaseClient={supabase}
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
