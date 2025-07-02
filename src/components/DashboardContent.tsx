'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardStats from '@/components/DashboardStats';
import ProjectCard from '@/components/ProjectCard';
import { Project } from '@/types';

interface DashboardContentProps {
  initialProjects: Project[];
}

export default function DashboardContent({ initialProjects }: DashboardContentProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects(prevProjects =>
      prevProjects.map(project =>
        project.id === updatedProject.id ? updatedProject : project
      )
    );
  };

  const handleProjectDelete = (projectId: string) => {
    setProjects(prevProjects =>
      prevProjects.filter(project => project.id !== projectId)
    );
  };

  return (
    <>
      {/* Stats Cards - 이제 실시간으로 업데이트됨 */}
      <DashboardStats projects={projects} />

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">프로젝트가 없습니다</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              첫 번째 비디오를 업로드하여 AI 자막 생성을 시작해보세요.<br />
              간단하고 빠른 프로세스로 전문적인 자막을 만들 수 있습니다.
            </p>
            <Link href="/">
              <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                새 프로젝트 시작하기
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onUpdate={handleProjectUpdate}
              onDelete={handleProjectDelete}
            />
          ))}
        </div>
      )}
    </>
  );
}