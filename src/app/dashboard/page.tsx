import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's projects
  const { data: projects, error } = await supabase
    .from('projects') // Assuming your table name is 'projects'
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

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
    <div className="container mx-auto p-8 min-h-[calc(100vh-64px)] flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Your Dashboard</h1>

      {projects.length === 0 ? (
        <div className="text-center p-10 border-2 border-dashed rounded-lg bg-white shadow-sm max-w-lg w-full">
          <p className="text-gray-600 mb-6 text-lg">You haven't created any projects yet.</p>
          <Link href="/">
            <button className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out">
              Start a New Project
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border border-gray-200 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out bg-white flex flex-col"
            >
              <h2 className="text-xl font-semibold mb-2 text-gray-800 truncate">
                {project.title || 'Untitled Project'}
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                Created: {new Date(project.created_at).toLocaleDateString()}
              </p>
              {project.video_url && (
                <div className="mb-4 flex-grow flex items-center justify-center">
                  <video src={project.video_url} controls className="w-full h-auto rounded-md object-cover" />
                </div>
              )}
              <div className="mt-auto">
                <Link href={`/project/${project.id}`}>
                  <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 transition duration-300 ease-in-out">
                    View Project
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
