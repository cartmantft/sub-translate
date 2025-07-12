'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useRef, DragEvent } from 'react';
import toast from 'react-hot-toast'; // Import toast
import { logger } from '@/lib/utils/logger';
import { generateThumbnailBase64 } from '@/lib/ffmpeg-client';

interface FileUploaderProps {
  onUploadSuccess?: (url: string, thumbnailBase64?: string) => void;
}

export default function FileUploader({ onUploadSuccess }: FileUploaderProps) {
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|avi|mov|mkv|webm)$/i)) {
      toast.error('지원하지 않는 파일 형식입니다. MP4, AVI, MOV, MKV, WEBM 파일을 선택해주세요.');
      return false;
    }
    
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast.error('파일 크기가 너무 큽니다. 500MB 이하의 파일을 선택해주세요.');
      return false;
    }
    
    return true;
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles[0]) {
      if (validateFile(droppedFiles[0])) {
        setFile(droppedFiles[0]);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('파일을 먼저 선택해주세요.');
      return;
    }

    setUploading(true);
    const loadingToastId = toast.loading('파일 업로드 중...');

    try {
      // 1. 비디오 파일 업로드
      const fileName = `${Date.now()}_${file.name}`;
      
      const { error } = await supabase.storage
        .from('videos')
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      // Get public URL of the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('업로드된 파일의 URL을 가져오는데 실패했습니다.');
      }

      // 2. 썸네일 생성 (FFmpeg.wasm 사용)
      let thumbnailBase64: string | undefined;
      
      try {
        setGeneratingThumbnail(true);
        toast.loading('썸네일 생성 중...', { id: loadingToastId });
        
        // HTML5 Canvas로 썸네일 생성 (종횡비 유지, 숏폼 지원)
        thumbnailBase64 = await generateThumbnailBase64(file, {
          maxWidth: 480,
          maxHeight: 360,
          seekTime: 1, // 1초 지점에서 썸네일 추출
          quality: 0.9, // JPEG 품질 90%
          maintainAspectRatio: true // 종횡비 유지 (숏폼 자동 감지)
        });
        
        console.log('썸네일 생성 완료:', thumbnailBase64.length);
      } catch (thumbnailError) {
        logger.error('썸네일 생성 실패', thumbnailError, { 
          component: 'FileUploader', 
          action: 'generateThumbnail' 
        });
        console.warn('썸네일 생성 실패, 계속 진행:', thumbnailError);
      } finally {
        setGeneratingThumbnail(false);
      }

      toast.success('파일이 성공적으로 업로드되었습니다!', { id: loadingToastId });
      if (onUploadSuccess) {
        onUploadSuccess(publicUrlData.publicUrl, thumbnailBase64);
      }
    } catch (error: unknown) {
      logger.error('Error uploading file', error, { component: 'FileUploader', action: 'handleUpload' });
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
      toast.error(`파일 업로드 오류: ${errorMessage}`, { id: loadingToastId });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !(uploading || generatingThumbnail) && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}
          ${(uploading || generatingThumbnail) ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          disabled={uploading || generatingThumbnail}
          className="hidden"
        />
        
        <div className="text-center">
          {!file ? (
            <>
              <div className="mx-auto w-16 h-16 mb-4">
                <svg className="w-full h-full text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700 mb-1">
                파일을 이곳에 드래그하거나 클릭하여 업로드하세요
              </p>
              <p className="text-sm text-gray-500">
                MP4, AVI, MOV, MKV, WEBM (최대 500MB)
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 mb-4">
                <svg className="w-full h-full text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-800 mb-1">{file.name}</p>
              <p className="text-sm text-gray-500 mb-4">
                {formatFileSize(file.size)}
              </p>
              {!(uploading || generatingThumbnail) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  다른 파일 선택
                </button>
              )}
            </>
          )}
        </div>

        {(uploading || generatingThumbnail) && (
          <div className="absolute inset-0 bg-white bg-opacity-90 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
              <p className="text-sm font-medium text-gray-700">
                {uploading && '업로드 중...'}
                {generatingThumbnail && '썸네일 생성 중...'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {uploading && '잠시만 기다려주세요'}
                {generatingThumbnail && 'HTML5 Canvas 처리 중...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {file && !(uploading || generatingThumbnail) && (
        <button
          onClick={handleUpload}
          className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          비디오 업로드 시작
        </button>
      )}
    </div>
  );
}
