'use client';

import { generateSRT, generateVTT, downloadFile } from '@/lib/subtitleExport';
import DropdownMenu from './DropdownMenu';

interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

interface SubtitleExportButtonsProps {
  subtitles: SubtitleSegment[];
  projectTitle: string;
  compact?: boolean;
  showTitle?: boolean;
  className?: string;
}

export default function SubtitleExportButtons({ 
  subtitles, 
  projectTitle, 
  compact = false, 
  className = '' 
}: SubtitleExportButtonsProps) {
  const handleDownloadSRT = () => {
    if (subtitles.length === 0) {
      alert('자막이 없어서 다운로드할 수 없습니다.');
      return;
    }

    const srtContent = generateSRT(subtitles);
    const filename = `${projectTitle || 'subtitles'}.srt`;
    downloadFile(srtContent, filename, 'text/plain');
  };

  const handleDownloadVTT = () => {
    if (subtitles.length === 0) {
      alert('자막이 없어서 다운로드할 수 없습니다.');
      return;
    }

    const vttContent = generateVTT(subtitles);
    const filename = `${projectTitle || 'subtitles'}.vtt`;
    downloadFile(vttContent, filename, 'text/vtt');
  };

  const downloadItems = [
    {
      label: 'SRT 형식으로 다운로드',
      description: '대부분의 비디오 플레이어에서 지원',
      onClick: handleDownloadSRT,
      disabled: subtitles.length === 0,
      icon: 'srt'
    },
    {
      label: 'VTT 형식으로 다운로드', 
      description: 'HTML5 비디오 및 YouTube 지원',
      onClick: handleDownloadVTT,
      disabled: subtitles.length === 0,
      icon: 'vtt'
    }
  ];

  const DownloadIcon = () => (
    <svg 
      className="w-5 h-5" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
      />
    </svg>
  );

  const ChevronDownIcon = () => (
    <svg 
      className="ml-2 w-4 h-4" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  return (
    <div className={className}>
      {!compact && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">자막 파일 형식 선택</h3>
              <p className="text-sm text-gray-600">필요한 형식을 선택하여 다운로드하세요</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleDownloadSRT}
          disabled={subtitles.length === 0}
          className={`flex-1 px-6 py-4 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
            subtitles.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
          }`}
        >
          <div className="flex items-center justify-center gap-3">
            <DownloadIcon />
            <div className="text-left">
              <div className="font-semibold">SRT 형식</div>
              <div className="text-xs opacity-90">대부분의 플레이어 지원</div>
            </div>
          </div>
        </button>
        
        <button
          onClick={handleDownloadVTT}
          disabled={subtitles.length === 0}
          className={`flex-1 px-6 py-4 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
            subtitles.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 shadow-sm hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-center gap-3">
            <DownloadIcon />
            <div className="text-left">
              <div className="font-semibold">VTT 형식</div>
              <div className="text-xs">웹 비디오 & YouTube</div>
            </div>
          </div>
        </button>
      </div>
      
      {subtitles.length === 0 && !compact && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            자막이 생성되면 다운로드 버튼이 활성화됩니다
          </p>
        </div>
      )}
      
      {compact && (
        <DropdownMenu
          trigger={
            <div className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
              subtitles.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400'
            }`}>
              <DownloadIcon />
              <span className="ml-2">다운로드</span>
              <ChevronDownIcon />
            </div>
          }
          items={downloadItems}
          disabled={subtitles.length === 0}
        />
      )}
    </div>
  );
}
