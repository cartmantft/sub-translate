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

// Helper function to generate subtitle segments with timing
function generateSubtitleSegments(transcription: string, translation: string) {
  // Split text into sentences for better subtitle segments
  const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const translatedSentences = translation.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Ensure we have matching number of segments (fallback if translation has different sentence count)
  const segmentCount = Math.min(sentences.length, translatedSentences.length);
  const averageSegmentDuration = 4; // seconds per segment (can be adjusted)
  
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
      setTranscription(transcriptionText);
      toast.success('Transcription complete! Now translating...', { id: loadingToastId });

      // Step 3: Call translation API (default to Korean for now)
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
      toast.success('Translation complete! Generating subtitles...', { id: loadingToastId });

      // Step 4: Generate subtitle segments with timing
      const subtitleSegments = generateSubtitleSegments(transcriptionText, translatedText);
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
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-8 px-4">
      <p className="text-center text-lg text-gray-600 mb-8">
        Upload a video to automatically generate and translate subtitles.
      </p>

      {error && (
        <div className="w-full mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">Error:</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!videoSrc && (
        <div className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg bg-white shadow-sm flex justify-center items-center">
          <FileUploader onUploadSuccess={handleUploadSuccess} />
        </div>
      )}

      {videoSrc && (
        <div className="w-full mt-8 space-y-8">
          <h2 className="text-3xl font-bold text-gray-800 text-center">Your Video</h2>
          <VideoPlayer src={videoSrc} />

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Processing video...</p>
            </div>
          )}

          {transcription && !loading && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-800 text-center">Transcription</h2>
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <p className="text-gray-700 leading-relaxed">{transcription}</p>
              </div>

              <h2 className="text-3xl font-bold text-gray-800 text-center">Subtitle Editor</h2>
              <SubtitleEditor initialSubtitles={subtitles} onSubtitlesChange={handleSubtitlesChange} />
              
              {projectId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">Project saved successfully!</p>
                  <p className="text-green-600 text-sm">Project ID: {projectId}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
