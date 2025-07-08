'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { generateSRT, generateVTT, downloadFile } from '@/lib/subtitleExport';

interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  originalText?: string;
}

interface ProjectActionsPanelProps {
  projectId: string;
  projectTitle: string;
  subtitles: SubtitleSegment[];
  autoRedirectSeconds?: number;
  onAutoRedirect?: () => void;
}

export default function ProjectActionsPanel({
  projectId,
  projectTitle,
  subtitles,
  autoRedirectSeconds = 0,
  onAutoRedirect
}: ProjectActionsPanelProps) {
  const [countdown, setCountdown] = useState(autoRedirectSeconds);
  const [isCountdownActive, setIsCountdownActive] = useState(autoRedirectSeconds > 0);

  useEffect(() => {
    if (countdown > 0 && isCountdownActive) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isCountdownActive && onAutoRedirect) {
      onAutoRedirect();
    }
  }, [countdown, isCountdownActive, onAutoRedirect]);

  const handleDownloadSRT = () => {
    if (subtitles.length === 0) {
      alert('자막이 없어서 다운로드할 수 없습니다.');
      return;
    }
    const srtContent = generateSRT(subtitles);
    downloadFile(srtContent, `${projectTitle}.srt`, 'text/plain');
  };

  const handleDownloadVTT = () => {
    if (subtitles.length === 0) {
      alert('자막이 없어서 다운로드할 수 없습니다.');
      return;
    }
    const vttContent = generateVTT(subtitles);
    downloadFile(vttContent, `${projectTitle}.vtt`, 'text/vtt');
  };

  const cancelAutoRedirect = () => {
    setIsCountdownActive(false);
    setCountdown(0);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
          <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">다음 단계를 선택하세요</h2>
        <p className="text-gray-600 text-sm">
          프로젝트를 편집하거나 자막을 다운로드하고 대시보드로 이동할 수 있습니다
        </p>
      </div>

      {/* Auto Redirect Notice */}
      {isCountdownActive && countdown > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-blue-700">
                {countdown}초 후 프로젝트 상세 페이지로 이동합니다
              </span>
            </div>
            <button
              onClick={cancelAutoRedirect}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Primary Actions */}
      <div className="space-y-4 mb-6">
        {/* Project Detail Button */}
        <a
          href={`/project/${projectId}`}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          프로젝트 편집하기
        </a>

        {/* Dashboard Button */}
        <a
          href="/dashboard"
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          대시보드로 이동
        </a>
      </div>

      {/* Download Section */}
      <div className="border-t border-gray-100 pt-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">자막 다운로드</h3>
          <p className="text-sm text-gray-600">
            생성된 자막을 원하는 형식으로 다운로드하세요
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* SRT Download */}
          <button
            onClick={handleDownloadSRT}
            disabled={subtitles.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            SRT 다운로드
          </button>

          {/* VTT Download */}
          <button
            onClick={handleDownloadVTT}
            disabled={subtitles.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            VTT 다운로드
          </button>
        </div>

        {subtitles.length === 0 && (
          <p className="text-center text-sm text-gray-500 mt-3">
            자막이 생성되지 않아 다운로드할 수 없습니다
          </p>
        )}
      </div>

      {/* New Project Link */}
      <div className="border-t border-gray-100 pt-4 mt-6">
        <Link
          href="/"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors duration-200 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          새 프로젝트 시작하기
        </Link>
      </div>
    </div>
  );
}