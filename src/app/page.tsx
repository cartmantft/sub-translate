import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import MainContent from '@/components/MainContent';

export default async function Home() {
  const supabase = await createClient();

  // 개발 환경에서는 세션 검증을 더 엄격하게
  let user = null;
  
  try {
    // 먼저 세션이 있는지 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      user = null;
    } else if (session) {
      // 세션이 있을 경우에만 getUser 호출하여 유효성 검증
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !authUser) {
        // 세션은 있지만 유효하지 않음
        console.error('Invalid session:', userError);
        await supabase.auth.signOut();
        user = null;
      } else {
        user = authUser;
      }
    }
  } catch (error) {
    console.error('Auth check error:', error);
    user = null;
  }


  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {user ? (
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                SubTranslate
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              AI를 활용하여 비디오에서 자막을 자동으로 추출하고 다양한 언어로 번역하는 스마트한 솔루션
            </p>
            <div className="mt-6 space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                환영합니다, {user.email?.split('@')[0]}님!
              </div>
              <div className="text-sm text-gray-600">
                <Link href="/dashboard" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  대시보드에서 모든 프로젝트를 관리하세요
                </Link>
              </div>
            </div>
          </div>

          {/* Features Grid with Enhanced Animations */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-blue-600 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">간편한 업로드</h3>
              <p className="text-gray-600 text-sm leading-relaxed">비디오 파일을 드래그 앤 드롭하거나 클릭하여 업로드하세요</p>
            </div>
            
            <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-purple-200 transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-purple-600 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">AI 자막 생성</h3>
              <p className="text-gray-600 text-sm leading-relaxed">OpenAI Whisper로 정확한 자막을 자동 생성합니다</p>
            </div>
            
            <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-green-200 transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-green-600 transition-transform duration-1000 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-green-600 transition-colors">스마트 번역</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Google Gemini로 자연스러운 다국어 번역을 제공합니다</p>
            </div>
          </div>

          {/* Main Content */}
          <MainContent />
        </div>
      ) : (
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="max-w-md w-full">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  SubTranslate
                </h1>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                비디오 자막을 AI로 자동 생성하고<br />
                다양한 언어로 번역하는 플랫폼
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">시작하기</h2>
                <p className="text-gray-600">
                  로그인하여 비디오 업로드와 자막 서비스를 이용해보세요
                </p>
              </div>
              
              <Link href="/login">
                <button className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  로그인하기
                </button>
              </Link>
              
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  계정이 없으신가요? 로그인 페이지에서 회원가입이 가능합니다.
                </p>
              </div>
            </div>

            {/* Features Preview with Enhanced Animations */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="group text-center cursor-pointer transform transition-all duration-300 hover:scale-110">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm group-hover:shadow-md transition-shadow">
                  <svg className="w-6 h-6 text-blue-600 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 font-semibold group-hover:text-blue-600 transition-colors">업로드</p>
              </div>
              <div className="group text-center cursor-pointer transform transition-all duration-300 hover:scale-110">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm group-hover:shadow-md transition-shadow">
                  <svg className="w-6 h-6 text-purple-600 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 font-semibold group-hover:text-purple-600 transition-colors">AI 처리</p>
              </div>
              <div className="group text-center cursor-pointer transform transition-all duration-300 hover:scale-110">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm group-hover:shadow-md transition-shadow">
                  <svg className="w-6 h-6 text-green-600 transition-transform duration-1000 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 font-semibold group-hover:text-green-600 transition-colors">다운로드</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
