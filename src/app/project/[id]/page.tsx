import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import VideoPlayer from '@/components/VideoPlayer';
import SubtitleEditor from '@/components/SubtitleEditor';
import SubtitleExportButtons from '@/components/SubtitleExportButtons';
import ProjectPageContent from '@/components/ProjectPageContent';

interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

interface Project {
  id: string;
  user_id: string;
  video_url: string;
  transcription: string;
  subtitles: SubtitleSegment[];
  title: string;
  created_at: string;
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch the specific project
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user can only access their own projects
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    if (error.code === 'PGRST116') {
      // No rows returned - project doesn't exist or user doesn't have access
      notFound();
    }
    throw new Error('Failed to load project');
  }

  if (!project) {
    notFound();
  }

  // Parse subtitles if they're stored as JSON string
  let parsedSubtitles: SubtitleSegment[] = [];
  try {
    parsedSubtitles = typeof project.subtitles === 'string' 
      ? JSON.parse(project.subtitles) 
      : project.subtitles || [];
  } catch (e) {
    console.error('Error parsing subtitles:', e);
    parsedSubtitles = [];
  }

  return <ProjectPageContent project={project} parsedSubtitles={parsedSubtitles} />;
}
