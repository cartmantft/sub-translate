export interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  originalText?: string;
}

export interface Project {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url?: string;
  transcription: string;
  subtitles: SubtitleSegment[] | null;
  title: string;
  created_at: string;
}