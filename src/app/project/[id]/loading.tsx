export default function Loading() {
  return (
    <div className="container mx-auto p-8 min-h-[calc(100vh-64px)]">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="border-b border-gray-200 pb-4">
          <div className="h-10 w-80 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Video Section */}
        <div className="space-y-6">
          <div>
            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="aspect-video bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          {/* Transcription Section */}
          <div>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/6"></div>
            </div>
          </div>
        </div>

        {/* Subtitles Section */}
        <div className="space-y-6">
          <div>
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div>
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-3"></div>
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Details skeleton */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <div className="h-5 w-36 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mr-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
