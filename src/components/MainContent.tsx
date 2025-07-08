'use client';

import { useState, useRef, useCallback } from 'react';
import FileUploader from '@/components/FileUploader';
import VideoPlayer, { VideoPlayerRef } from '@/components/VideoPlayer';
import CompactSuccessBanner from '@/components/CompactSuccessBanner';
import ProjectActionsPanel from '@/components/ProjectActionsPanel';
import StepIndicator, { ProcessStep } from '@/components/StepIndicator';
import toast from 'react-hot-toast';
import { logger } from '@/lib/utils/logger';
import { useCsrfToken, fetchWithCsrf } from '@/hooks/useCsrfToken';

interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  originalText?: string;
}

// Helper function to generate unified subtitle segments with both original and translated text
function generateUnifiedSubtitleSegments(transcription: string, translation: string, whisperSegments?: { start: number; end: number; text: string }[]): SubtitleSegment[] {
  // If we have Whisper segments with timestamps, use them
  if (whisperSegments && whisperSegments.length > 0) {
    const translatedSentences = translation.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return whisperSegments.map((segment, index) => ({
      id: `${index + 1}`,
      startTime: segment.start,
      endTime: segment.end,
      text: translatedSentences[index]?.trim() || segment.text?.trim() || '',
      originalText: segment.text?.trim() || '',
    }));
  }
  
  // Fallback: Split text into sentences for better subtitle segments
  const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const translatedSentences = translation.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Ensure we have matching number of segments (fallback if translation has different sentence count)
  const segmentCount = Math.min(sentences.length, translatedSentences.length);
  const averageSegmentDuration = 4; // seconds per segment (fallback only)
  
  const segments = [];
  for (let i = 0; i < segmentCount; i++) {
    const startTime = i * averageSegmentDuration;
    const endTime = (i + 1) * averageSegmentDuration;
    
    segments.push({
      id: `${i + 1}`,
      startTime,
      endTime,
      text: translatedSentences[i]?.trim() || sentences[i]?.trim() || '',
      originalText: sentences[i]?.trim() || '',
    });
  }
  
  return segments;
}

export default function MainContent() {
  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const [videoSrc, setVideoSrc] = useState('');
  const [transcription, setTranscription] = useState('');
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]); // To store unified segments
  const [projectId, setProjectId] = useState<string | null>(null); // To store the ID of the created project
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<ProcessStep>('upload');
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  
  // CSRF token management for secure API requests
  const { getToken, error: csrfError } = useCsrfToken();

  const handleUploadSuccess = async (url: string) => {
    setVideoSrc(url);
    setError(null);
    setLoading(true);
    setCurrentStep('transcribe');
    const loadingToastId = toast.loading('음성을 인식하고 있습니다...');

    try {
      // Check for CSRF errors early
      if (csrfError) {
        throw new Error(`보안 시스템 오류: ${csrfError}. 페이지를 새로고침하고 다시 시도해주세요.`);
      }
      // Step 1: Get the video file from the URL to send to transcription API
      const videoResponse = await fetch(url);
      const videoBlob = await videoResponse.blob();
      const videoFile = new File([videoBlob], 'video.mp4', { type: videoBlob.type });

      // Step 2: Call transcription API
      const formData = new FormData();
      formData.append('file', videoFile);

      // Get CSRF token for secure API request
      const csrfToken = await getToken();
      
      const transcribeResponse = await fetchWithCsrf('/api/transcribe', {
        method: 'POST',
        body: formData,
      }, csrfToken);

      const transcribeResult = await transcribeResponse.json();
      if (!transcribeResponse.ok) {
        throw new Error(transcribeResult.error || 'Failed to transcribe video');
      }

      const transcriptionText = transcribeResult.transcription;
      const whisperSegments = transcribeResult.segments;
      setTranscription(transcriptionText);
      setCurrentStep('translate');
      toast.success('음성 인식 완료! 번역을 시작합니다...', { id: loadingToastId });

      // Step 3: Call translation API with segments for better accuracy
      let subtitleSegments;
      
      if (whisperSegments && whisperSegments.length > 0) {
        // Translate each Whisper segment individually for better accuracy
        logger.info('Translating individual segments', { component: 'MainContent', action: 'handleUploadSuccess' });
        const translateResponse = await fetchWithCsrf('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            segments: whisperSegments,
            targetLanguage: 'Korean',
          }),
        }, csrfToken);

        const translateResult = await translateResponse.json();
        if (!translateResponse.ok) {
          throw new Error(translateResult.error || 'Failed to translate segments');
        }

        // Convert translated segments to unified subtitle format with original text
        subtitleSegments = translateResult.translatedSegments.map((segment: { start: number; end: number; text: string; translatedText?: string }, index: number) => ({
          id: `${index + 1}`,
          startTime: segment.start,
          endTime: segment.end,
          text: segment.translatedText || segment.text || '',
          originalText: whisperSegments[index]?.text || '',
        }));
      } else {
        // Fallback: translate entire text for backward compatibility
        logger.info('Translating entire text as fallback', { component: 'MainContent', action: 'handleUploadSuccess' });
        const translateResponse = await fetchWithCsrf('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: transcriptionText,
            targetLanguage: 'Korean',
          }),
        }, csrfToken);

        const translateResult = await translateResponse.json();
        if (!translateResponse.ok) {
          throw new Error(translateResult.error || 'Failed to translate text');
        }

        const translatedText = translateResult.translation;
        subtitleSegments = generateUnifiedSubtitleSegments(transcriptionText, translatedText, whisperSegments);
      }

      toast.success('번역 완료! 자막을 생성하고 있습니다...', { id: loadingToastId });
      setSubtitles(subtitleSegments);
      setCurrentStep('complete');

      // Step 5: Save the project to the database via API route
      const response = await fetchWithCsrf('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: url,
          transcription: transcriptionText,
          subtitles: subtitleSegments,
          originalSegments: whisperSegments || [],
          title: `Video Project - ${new Date().toISOString().split('T')[0]}`,
        }),
      }, csrfToken);

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save project via API');
      }

      toast.success('프로젝트가 성공적으로 저장되었습니다!', { id: loadingToastId });
      setProjectId(result.projectId);
      logger.info('Project saved successfully', { component: 'MainContent', action: 'handleUploadSuccess', projectId: result.projectId });

    } catch (err) {
      logger.error('Error processing video', err, { component: 'MainContent', action: 'handleUploadSuccess', videoUrl: url });
      
      let errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Handle specific CSRF errors with user-friendly messages
      if (errorMessage.includes('CSRF') || errorMessage.includes('403')) {
        errorMessage = '보안 토큰이 만료되었습니다. 페이지를 새로고침하고 다시 시도해주세요.';
      } else if (errorMessage.includes('401')) {
        errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.';
      }
      
      setError(`비디오 처리 중 오류가 발생했습니다: ${errorMessage}`);
      toast.error(`비디오 처리 실패: ${errorMessage}`, { id: loadingToastId });
    } finally {
      setLoading(false);
      if (!subtitles.length) {
        setCurrentStep('upload');
      }
    }
  };

  const handleSubtitleClick = useCallback((startTime: number) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.jumpToTime(startTime);
    }
  }, []);

  const handleVideoTimeUpdate = useCallback((time: number) => {
    setCurrentVideoTime(time);
  }, []);


  return (
    <div className="w-full max-w-6xl mx-auto">
      {error && (
        <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-800 font-semibold">처리 중 오류가 발생했습니다</p>
          </div>
          <p className="text-red-600 ml-11">{error}</p>
        </div>
      )}

      {!videoSrc && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Upload Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h2 className="text-2xl font-semibold text-white text-center">비디오 업로드</h2>
            <p className="text-blue-100 text-center mt-2">
              비디오 파일을 업로드하면 AI가 자동으로 자막을 생성하고 번역합니다
            </p>
          </div>
          
          {/* Upload Area */}
          <div className="p-8">
            <FileUploader onUploadSuccess={handleUploadSuccess} />
          </div>
          
          {/* Upload Instructions */}
          <div className="border-t border-gray-100 px-8 py-6 bg-gray-50">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">비디오를 업로드하고 자막을 생성해보세요</h3>
              <p className="text-sm text-gray-600">
                MP4, AVI, MOV, MKV, WEBM 파일을 지원합니다 (최대 500MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {videoSrc && (
        <div className="space-y-8">
          {loading && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <StepIndicator currentStep={currentStep} className="mb-8" />
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">AI가 비디오를 처리하고 있습니다</h3>
                <p className="text-gray-600">
                  {currentStep === 'transcribe' && '음성을 텍스트로 변환하고 있습니다...'}
                  {currentStep === 'translate' && '텍스트를 한국어로 번역하고 있습니다...'}
                  {currentStep === 'complete' && '자막 생성을 마무리하고 있습니다...'}
                </p>
              </div>
            </div>
          )}

          {transcription && subtitles.length > 0 && !loading && (
            <div className="space-y-6">
              {/* Success Banner */}
              {projectId && (
                <CompactSuccessBanner
                  projectId={projectId}
                  projectTitle={`Video Project - ${new Date().toISOString().split('T')[0]}`}
                  subtitleCount={subtitles.length}
                  videoDuration={subtitles.length > 0 ? subtitles[subtitles.length - 1]?.endTime : 0}
                  createdAt={new Date().toISOString()}
                />
              )}

              {/* Main Content: Video Player and Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Video Section - Takes 2 columns on large screens */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3">
                      <h2 className="text-lg font-semibold text-white text-center">자막이 포함된 비디오</h2>
                    </div>
                    <div className="p-4">
                      <VideoPlayer 
                        ref={videoPlayerRef} 
                        src={videoSrc} 
                        subtitles={subtitles} 
                        onTimeUpdate={handleVideoTimeUpdate} 
                        roundedCorners="all" 
                      />
                    </div>
                  </div>
                </div>

                {/* Actions Panel - Takes 1 column on large screens */}
                <div className="lg:col-span-1">
                  {projectId ? (
                    <ProjectActionsPanel
                      projectId={projectId}
                      projectTitle={`Video Project - ${new Date().toISOString().split('T')[0]}`}
                      subtitles={subtitles}
                      autoRedirectSeconds={5}
                      onAutoRedirect={() => {
                        window.location.href = `/project/${projectId}`;
                      }}
                    />
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">프로젝트 저장 중...</h3>
                        <p className="text-gray-500 text-sm">잠시 기다려주세요</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Loading state shows video section only */}
          {!transcription && !loading && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4">
                <h2 className="text-xl font-semibold text-white text-center">업로드된 비디오</h2>
              </div>
              <div className="p-6">
                <VideoPlayer ref={videoPlayerRef} src={videoSrc} onTimeUpdate={handleVideoTimeUpdate} roundedCorners="all" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
