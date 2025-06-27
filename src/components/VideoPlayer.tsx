'use client';

interface VideoPlayerProps {
  src: string;
  // TODO: Add props for subtitles/tracks
}

export default function VideoPlayer({ src }: VideoPlayerProps) {
  if (!src) {
    return <div>No video source provided.</div>;
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg shadow-lg bg-black">
      <video controls className="w-full h-auto max-w-full rounded-lg">
        <source src={src} type="video/mp4" />
        {/* <track
          src="/path/to/subtitles.vtt"
          kind="subtitles"
          srcLang="en"
          label="English"
        /> */}
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
