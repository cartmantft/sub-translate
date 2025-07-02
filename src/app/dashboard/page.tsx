import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ProjectsList from '@/components/ProjectsList';

export default async function DashboardPage() {
  const supabase = await createClient();

  // 먼저 세션이 있는지 확인
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  // 세션이 있을 경우에만 getUser 호출
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch user's projects
  const { data: projects, error } = await supabase
    .from('projects') // Assuming your table name is 'projects'
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Debug: Log the projects data to see thumbnail URLs
  console.log('Fetched projects:', projects?.map(p => ({
    id: p.id,
    title: p.title,
    thumbnail_url: p.thumbnail_url,
    video_url: p.video_url
  })));

  if (error) {
    console.error('Error fetching projects:', error);
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>
        <p className="text-red-500">Error loading projects: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-12">
          <div className="text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                내 프로젝트
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              생성된 프로젝트들을 관리하고 자막 파일을 다운로드하세요
            </p>
          </div>
          
          {/* New Project Button - Top Right */}
          <Link href="/">
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 프로젝트
            </button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4L5.5 6M17 4l1.5 2M12 8v8m-4-4h8" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-800">{projects.length}</p>
                <p className="text-sm text-gray-600">총 프로젝트</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-800">{projects.filter(p => p.subtitles).length}</p>
                <p className="text-sm text-gray-600">완료된 번역</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-800">
                  {projects.length > 0 ? new Date(Math.max(...projects.map(p => new Date(p.created_at).getTime()))).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-'}
                </p>
                <p className="text-sm text-gray-600">최근 업데이트</p>
              </div>
            </div>
          </div>
        </div>


        {/* Projects List with Edit/Delete Functionality */}
        <ProjectsList initialProjects={projects} />

      </div>
    </div>
  );
}
