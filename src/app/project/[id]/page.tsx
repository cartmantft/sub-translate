import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import ProjectPageContent from '@/components/ProjectPageContent';
import { logger } from '@/lib/utils/logger';

interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}


export default async function ProjectPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
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
    logger.error('Error fetching project', error, {
      component: 'ProjectPage',
      action: 'fetch_project',
      projectId: id,
      userId: user?.id
    });
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
    logger.error('Error parsing subtitles', e, {
      component: 'ProjectPage',
      action: 'parse_subtitles',
      projectId: id,
      userId: user?.id
    });
    parsedSubtitles = [];
  }

  return <ProjectPageContent project={project} parsedSubtitles={parsedSubtitles} />;
}
