'use client';

import { generateSRT, generateVTT, downloadFile } from '@/lib/subtitleExport';

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

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-800 mb-3">Export Options</h3>
      <div className="space-y-2">
        <button 
          onClick={handleDownloadSRT}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          disabled={subtitles.length === 0}
        >
          Download SRT
        </button>
        <button 
          onClick={handleDownloadVTT}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          disabled={subtitles.length === 0}
        >
          Download VTT
        </button>
      </div>
      {subtitles.length === 0 && (
        <p className="text-sm text-gray-500 mt-2">
          자막이 생성되면 다운로드할 수 있습니다.
        </p>
      )}
    </div>
  );
}
