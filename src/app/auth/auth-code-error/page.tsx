'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('인증 과정에서 문제가 발생했습니다.');
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const errorCode = searchParams.get('error_code');

    if (errorCode) {
      setErrorCode(errorCode);
    }

    // Set user-friendly error messages based on the error type
    if (error === 'access_denied') {
      setErrorMessage('로그인이 취소되었습니다. 다시 시도해 주세요.');
    } else if (error === 'server_error') {
      setErrorMessage('서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } else if (error === 'temporarily_unavailable') {
      setErrorMessage('서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.');
    } else if (error === 'oauth_exchange_failed') {
      setErrorMessage('소셜 로그인 연동에 실패했습니다. Google 계정 연결을 다시 시도해 주세요.');
    } else if (errorDescription) {
      // Use error description if available, but sanitize it for production
      if (process.env.NODE_ENV === 'development') {
        setErrorMessage(errorDescription);
      } else {
        setErrorMessage('인증 과정에서 문제가 발생했습니다. 다시 시도해 주세요.');
      }
    }
  }, [searchParams]);

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
        </div>

        {/* Error Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Card Header with Error Icon */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6">
            <div className="flex items-center justify-center mb-3">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-white text-center">인증 오류</h2>
          </div>

          {/* Card Content */}
          <div className="p-8">
            <div className="text-center mb-8">
              <p className="text-gray-700 text-lg mb-4">{errorMessage}</p>
              {process.env.NODE_ENV === 'development' && (errorCode || searchParams.get('error_description')) && (
                <div className="text-sm text-gray-500 font-mono bg-gray-100 p-3 rounded space-y-1 text-left">
                  {errorCode && <div>Error Code: {errorCode}</div>}
                  {searchParams.get('error') && <div>Error Type: {searchParams.get('error')}</div>}
                  {searchParams.get('error_description') && (
                    <div>Details: {searchParams.get('error_description')}</div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl px-6 py-3 font-semibold text-center hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                다시 로그인하기
              </Link>
              <Link
                href="/"
                className="block w-full bg-gray-100 text-gray-700 rounded-xl px-6 py-3 font-semibold text-center hover:bg-gray-200 transition-colors"
              >
                홈으로 돌아가기
              </Link>
            </div>

            {/* Help Text */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                계속해서 문제가 발생하면{' '}
                <a href="mailto:support@subtranslate.com" className="text-blue-600 hover:underline">
                  고객 지원팀
                </a>
                에 문의해 주세요.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            일반적인 해결 방법:
          </p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1">
            <li>• 브라우저 쿠키 및 캐시 삭제</li>
            <li>• 다른 브라우저로 시도</li>
            <li>• 네트워크 연결 확인</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}