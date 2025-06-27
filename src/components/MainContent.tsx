'use client';

import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import VideoPlayer from '@/components/VideoPlayer';
import SubtitleEditor from '@/components/SubtitleEditor';
import { createClient } from '@/lib/supabase/client'; // Import client-side supabase
import toast from 'react-hot-toast'; // Import toast

export default function MainContent() {
  const [videoSrc, setVideoSrc] = useState('');
  const [transcription, setTranscription] = useState('');
  const [subtitles, setSubtitles] = useState<any[]>([]); // To store parsed subtitles
  const [projectId, setProjectId] = useState<string | null>(null); // To store the ID of the created project
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploadSuccess = async (url: string) => {
    setVideoSrc(url);
    setError(null);
    setLoading(true);
    const loadingToastId = toast.loading('Transcribing video...');

    // In a real scenario, after upload, you'd trigger transcription API
    // For now, let's simulate transcription and then provide dummy subtitles
    const dummyTranscription = "This is a sample transcription. It has multiple sentences.";
    const dummySubtitles = [
      { id: '1', startTime: 0, endTime: 3, text: 'This is a sample transcription.' },
      { id: '2', startTime: 3.5, endTime: 6, text: 'It has multiple sentences.' },
    ];

    setTimeout(async () => {
      setTranscription(dummyTranscription);
      setSubtitles(dummySubtitles);
      toast.success('Transcription complete!', { id: loadingToastId });

      // Save the project to the database via API route
      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoUrl: url,
            transcription: dummyTranscription,
            subtitles: dummySubtitles,
            title: `Video Project - ${new Date().toLocaleDateString()}`,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to save project via API');
        }

        toast.success('Project saved successfully!', { id: loadingToastId });
        setProjectId(result.projectId);
      } catch (err: any) {
        console.error('Error saving project:', err);
        setError(err.message);
        toast.error(`Failed to save project: ${err.message}`, { id: loadingToastId });
      } finally {
        setLoading(false);
      }
    }, 2000); // Simulate API call
  };

  const handleSubtitlesChange = (updatedSubtitles: any[]) => {
    setSubtitles(updatedSubtitles);
    console.log('Subtitles updated:', updatedSubtitles);
    // TODO: Optionally update the project in DB here or save on explicit user action
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-8 px-4">
      <p className="text-center text-lg text-gray-600 mb-8">
        Upload a video to automatically generate and translate subtitles.
      </p>

      {!videoSrc && (
        <div className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg bg-white shadow-sm flex justify-center items-center">
          <FileUploader onUploadSuccess={handleUploadSuccess} />
        </div>
      )}

      {videoSrc && (
        <div className="w-full mt-8 space-y-8">
          <h2 className="text-3xl font-bold text-gray-800 text-center">Your Video</h2>
          <VideoPlayer src={videoSrc} />

          {transcription && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-800 text-center">Transcription</h2>
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <p className="text-gray-700 leading-relaxed">{transcription}</p>
              </div>

              <h2 className="text-3xl font-bold text-gray-800 text-center">Subtitle Editor</h2>
              <SubtitleEditor initialSubtitles={subtitles} onSubtitlesChange={handleSubtitlesChange} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
