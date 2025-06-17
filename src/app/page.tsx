'use client';

import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import VideoPlayer from '@/components/VideoPlayer';

export default function Home() {
  const [videoSrc, setVideoSrc] = useState('');

  // This is a placeholder handler.
  // In a real app, the FileUploader component would handle the upload
  // and then call a function passed via props to set the video source URL.
  const handleUploadSuccess = (url: string) => {
    setVideoSrc(url);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="container mx-auto max-w-2xl space-y-8">
        <h1 className="text-4xl font-bold text-center">SubTranslate</h1>
        <p className="text-center text-gray-500">
          Upload a video to automatically generate and translate subtitles.
        </p>
        <div className="p-8 border-2 border-dashed rounded-lg">
          <FileUploader />
        </div>
        {videoSrc && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Your Video</h2>
            <VideoPlayer src={videoSrc} />
          </div>
        )}
      </div>
    </main>
  );
}
