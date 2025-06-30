'use client';

import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import VideoPlayer from '@/components/VideoPlayer';
import SubtitleEditor from '@/components/SubtitleEditor';
// Note: createClient import removed as it's not needed for API route calls
import toast from 'react-hot-toast'; // Import toast

interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

// Helper function to generate subtitle segments using Whisper timestamps
function generateSubtitleSegments(transcription: string, translation: string, whisperSegments?: any[]) {
  // If we have Whisper segments with timestamps, use them
  if (whisperSegments && whisperSegments.length > 0) {
    const translatedSentences = translation.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return whisperSegments.map((segment, index) => ({
      id: `${index + 1}`,
      startTime: segment.start,
      endTime: segment.end,
      text: translatedSentences[index]?.trim() || segment.text?.trim() || '',
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
    });
  }
  
  return segments;
}

export default function MainContent() {
  const [videoSrc, setVideoSrc] = useState('');
  const [transcription, setTranscription] = useState('');
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]); // To store parsed subtitles
  const [projectId, setProjectId] = useState<string | null>(null); // To store the ID of the created project
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploadSuccess = async (url: string) => {
    setVideoSrc(url);
    setError(null);
    setLoading(true);
    const loadingToastId = toast.loading('Transcribing video...');

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
      toast.success('Transcription complete! Now translating...', { id: loadingToastId });

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

        // Convert translated segments to subtitle format
        subtitleSegments = translateResult.translatedSegments.map((segment: any, index: number) => ({
          id: `${index + 1}`,
          startTime: segment.start,
          endTime: segment.end,
          text: segment.translatedText || segment.text || '',
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
        subtitleSegments = generateSubtitleSegments(transcriptionText, translatedText, whisperSegments);
      }

      toast.success('Translation complete! Generating subtitles...', { id: loadingToastId });
      setSubtitles(subtitleSegments);

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
          title: `Video Project - ${new Date().toLocaleDateString()}`,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save project via API');
      }

      toast.success('Project saved successfully!', { id: loadingToastId });
      setProjectId(result.projectId);
      console.log('Project saved with ID:', result.projectId);

    } catch (err) {
      console.error('Error processing video:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Failed to process video: ${errorMessage}`, { id: loadingToastId });
    } finally {
      setLoading(false);
    }
  };

  const handleSubtitlesChange = (updatedSubtitles: SubtitleSegment[]) => {
    setSubtitles(updatedSubtitles);
    console.log('Subtitles updated:', updatedSubtitles);
    // TODO: Optionally update the project in DB here or save on explicit user action
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
          
          {/* Process Steps */}
          <div className="border-t border-gray-100 px-8 py-6 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-4 text-center">처리 과정</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">1. 음성 인식</p>
                <p className="text-xs text-gray-500">OpenAI Whisper로 정확한 텍스트 추출</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">2. 언어 번역</p>
                <p className="text-xs text-gray-500">Google Gemini로 자연스러운 번역</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">3. 파일 생성</p>
                <p className="text-xs text-gray-500">SRT/VTT 형식으로 다운로드 가능</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {videoSrc && (
        <div className="space-y-8">
          {/* Video Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4">
              <h2 className="text-xl font-semibold text-white text-center">업로드된 비디오</h2>
            </div>
            <div className="p-6">
              <VideoPlayer src={videoSrc} />
            </div>
          </div>

          {loading && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">AI가 비디오를 처리하고 있습니다</h3>
                <p className="text-gray-600 mb-4">음성 인식과 번역 작업이 진행 중입니다. 잠시만 기다려주세요.</p>
                <div className="max-w-md mx-auto">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {transcription && !loading && (
            <div className="space-y-8">
              {/* Transcription Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4">
                  <h2 className="text-xl font-semibold text-white text-center">원본 음성 인식 결과</h2>
                </div>
                <div className="p-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{transcription}</p>
                  </div>
                </div>
              </div>

              {/* Subtitle Editor Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-teal-600 px-8 py-4">
                  <h2 className="text-xl font-semibold text-white text-center">번역된 자막 편집기</h2>
                </div>
                <div className="p-6">
                  <SubtitleEditor initialSubtitles={subtitles} onSubtitlesChange={handleSubtitlesChange} />
                </div>
              </div>
              
              {projectId && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-green-800 mb-2">프로젝트가 성공적으로 저장되었습니다!</h3>
                    <p className="text-green-700 mb-6">
                      이제 프로젝트를 확인하고 자막 파일을 다운로드할 수 있습니다.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <a 
                        href={`/project/${projectId}`}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        프로젝트 상세보기
                      </a>
                      <a 
                        href="/dashboard"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        대시보드로 이동
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
