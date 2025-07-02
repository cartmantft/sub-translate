'use client';

import { Project } from '@/types';

interface DashboardStatsProps {
  projects: Project[];
}

export default function DashboardStats({ projects }: DashboardStatsProps) {
  const completedTranslations = projects.filter(p => p.subtitles).length;
  const latestDate = projects.length > 0 
    ? new Date(Math.max(...projects.map(p => new Date(p.created_at).getTime())))
        .toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    : '-';

  return (
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
            <p className="text-2xl font-bold text-gray-800">{completedTranslations}</p>
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
            <p className="text-2xl font-bold text-gray-800">{latestDate}</p>
            <p className="text-sm text-gray-600">최근 업데이트</p>
          </div>
        </div>
      </div>
    </div>
  );
}