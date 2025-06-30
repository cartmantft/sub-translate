import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import VideoPlayer from '@/components/VideoPlayer';
import SubtitleEditor from '@/components/SubtitleEditor';
import SubtitleExportButtons from '@/components/SubtitleExportButtons';

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

  return (
    <div className="container mx-auto p-8 min-h-[calc(100vh-64px)]">
      {/* Header with back button */}
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {project.title || 'Untitled Project'}
          </h1>
          <p className="text-gray-500">
            Created on {new Date(project.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Video Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Video</h2>
            {project.video_url ? (
              <VideoPlayer src={project.video_url} />
            ) : (
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-500">No video available</p>
              </div>
            )}
          </div>

          {/* Original Transcription */}
          {project.transcription && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Original Transcription</h2>
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 max-h-64 overflow-y-auto">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {project.transcription}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Subtitles Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Subtitles</h2>
            {parsedSubtitles.length > 0 ? (
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {parsedSubtitles.map((subtitle, index) => (
                    <div key={subtitle.id} className="border-b border-gray-200 pb-3 last:border-b-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-600">
                          {Math.floor(subtitle.startTime / 60)}:{(subtitle.startTime % 60).toFixed(0).padStart(2, '0')} - {Math.floor(subtitle.endTime / 60)}:{(subtitle.endTime % 60).toFixed(0).padStart(2, '0')}
                        </span>
                        <span className="text-xs text-gray-400">#{index + 1}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{subtitle.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-500">No subtitles available</p>
              </div>
            )}
          </div>

          {/* Export Options */}
          <SubtitleExportButtons 
            subtitles={parsedSubtitles} 
            projectTitle={project.title || 'Untitled Project'} 
          />
        </div>
      </div>

      {/* Project Details */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Project Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Project ID:</span>
            <span className="ml-2 text-gray-800">{project.id}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Status:</span>
            <span className="ml-2 text-green-600">Completed</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Subtitle Count:</span>
            <span className="ml-2 text-gray-800">{parsedSubtitles.length} segments</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Video Duration:</span>
            <span className="ml-2 text-gray-800">
              {parsedSubtitles.length > 0 
                ? `~${Math.ceil(parsedSubtitles[parsedSubtitles.length - 1]?.endTime || 0)} seconds`
                : 'Unknown'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
