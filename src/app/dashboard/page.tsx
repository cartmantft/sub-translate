import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import DashboardContent from '@/components/DashboardContent';

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

        {/* Dashboard Content with Reactive Stats and Projects */}
        <DashboardContent initialProjects={projects || []} />

      </div>
    </div>
  );
}
