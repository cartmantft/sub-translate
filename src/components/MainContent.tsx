'use client';

import { useState, useRef } from 'react';
import FileUploader from '@/components/FileUploader';
import VideoPlayer, { VideoPlayerRef } from '@/components/VideoPlayer';
import UnifiedSubtitleViewer from '@/components/UnifiedSubtitleViewer';
import SubtitleExportButtons from '@/components/SubtitleExportButtons';
import StepIndicator, { ProcessStep } from '@/components/StepIndicator';
import toast from 'react-hot-toast';

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

  const handleUploadSuccess = async (url: string) => {
    setVideoSrc(url);
    setError(null);
    setLoading(true);
    setCurrentStep('transcribe');
    const loadingToastId = toast.loading('음성을 인식하고 있습니다...');

    try {
      // Step 1: Get the video file from the URL to send to transcription API
      const videoResponse = await fetch(url);
      const videoBlob = await videoResponse.blob();
      const videoFile = new File([videoBlob], 'video.mp4', { type: videoBlob.type });

      // Step 2: Call transcription API
      const formData = new FormData();
      formData.append('file', videoFile);

      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

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
        console.log('Translating individual segments...');
        const translateResponse = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            segments: whisperSegments,
            targetLanguage: 'Korean',
          }),
        });

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
        console.log('Translating entire text as fallback...');
        const translateResponse = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: transcriptionText,
            targetLanguage: 'Korean',
          }),
        });

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
      const response = await fetch('/api/projects', {
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
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save project via API');
      }

      toast.success('프로젝트가 성공적으로 저장되었습니다!', { id: loadingToastId });
      setProjectId(result.projectId);
      console.log('Project saved with ID:', result.projectId);

    } catch (err) {
      console.error('Error processing video:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`비디오 처리 중 오류가 발생했습니다: ${errorMessage}`);
      toast.error(`비디오 처리 실패: ${errorMessage}`, { id: loadingToastId });
    } finally {
      setLoading(false);
      if (!subtitles.length) {
        setCurrentStep('upload');
      }
    }
  };

  const handleSubtitleClick = (startTime: number) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.jumpToTime(startTime);
    }
  };


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
              {/* Top Row: Video and Subtitles side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Video Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3">
                    <h2 className="text-lg font-semibold text-white text-center">업로드된 비디오</h2>
                  </div>
                  <div className="p-4">
                    <VideoPlayer ref={videoPlayerRef} src={videoSrc} />
                  </div>
                </div>

                {/* Unified Subtitle Viewer */}
                <UnifiedSubtitleViewer 
                  segments={subtitles}
                  onSegmentClick={handleSubtitleClick}
                  showOriginal={true}
                />
              </div>

              {/* Bottom Row: Download Section and Project Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Enhanced Download Section */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 shadow-sm border border-indigo-100">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-lg mb-3">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">자막이 준비되었습니다!</h2>
                    <p className="text-gray-600 text-sm">원하는 형식으로 자막 파일을 다운로드하세요</p>
                  </div>
                  <SubtitleExportButtons 
                    subtitles={subtitles} 
                    projectTitle={`Video Project - ${new Date().toISOString().split('T')[0]}`} 
                  />
                </div>

                {/* Project Success Section */}
                {projectId && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-green-800 mb-2">프로젝트 저장 완료!</h3>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <a 
                          href={`/project/${projectId}`}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          프로젝트 상세보기
                        </a>
                        <a 
                          href="/dashboard"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          대시보드로 이동
                        </a>
                      </div>
                    </div>
                  </div>
                )}
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
                <VideoPlayer ref={videoPlayerRef} src={videoSrc} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
