import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto p-8 min-h-[calc(100vh-64px)] flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Project Not Found</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          The project you're looking for doesn't exist or you don't have permission to access it.
        </p>
        
        <div className="space-y-4">
          <Link href="/dashboard">
            <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out">
              Back to Dashboard
            </button>
          </Link>
          
          <div>
            <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
              Create a New Project
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
