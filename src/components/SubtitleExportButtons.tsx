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
}

export default function SubtitleExportButtons({ subtitles, projectTitle }: SubtitleExportButtonsProps) {
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
      label: 'Download SRT',
      onClick: handleDownloadSRT,
      disabled: subtitles.length === 0
    },
    {
      label: 'Download VTT', 
      onClick: handleDownloadVTT,
      disabled: subtitles.length === 0
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

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-800 mb-3">Export Options</h3>
      <div className="flex justify-start">
        <DropdownMenu
          trigger={
            <div className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
              subtitles.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400'
            }`}>
              <DownloadIcon />
              <span className="ml-2">Download</span>
              <svg 
                className="ml-2 w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          }
          items={downloadItems}
          disabled={subtitles.length === 0}
        />
      </div>
      {subtitles.length === 0 && (
        <p className="text-sm text-gray-500 mt-2">
          자막이 생성되면 다운로드할 수 있습니다.
        </p>
      )}
    </div>
  );
}
