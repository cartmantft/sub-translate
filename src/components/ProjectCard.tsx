'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProjectThumbnail from '@/components/ProjectThumbnail';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  onUpdate: (updatedProject: Project) => void;
  onDelete: (projectId: string) => void;
}

export default function ProjectCard({ project, onUpdate, onDelete }: ProjectCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(project.title || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEditStart = () => {
    setEditTitle(project.title || '');
    setIsEditing(true);
    setError(null);
  };

  const handleEditCancel = () => {
    setEditTitle(project.title || '');
    setIsEditing(false);
    setError(null);
  };

  const handleEditSave = async () => {
    if (!editTitle.trim()) {
      setError('프로젝트 이름을 입력해주세요');
      return;
    }

    if (editTitle.trim() === project.title) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editTitle.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update project');
      }

      // Update the project in the parent component
      onUpdate(data.project);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating project:', error);
      setError(error instanceof Error ? error.message : 'Failed to update project');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteStart = () => {
    setIsDeleteModalOpen(true);
    setError(null);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete project');
      }

      // Remove the project from the parent component
      onDelete(project.id);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting project:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
        {/* Project Thumbnail */}
        <div className="relative h-48 overflow-hidden">
          <ProjectThumbnail 
            thumbnailUrl={project.thumbnail_url}
            videoUrl={project.video_url}
            title={project.title}
          />
          
          {/* Action Buttons Overlay */}
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEditStart}
              disabled={isUpdating || isDeleting}
              className="w-8 h-8 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors shadow-sm"
              title="프로젝트 이름 수정"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteStart}
              disabled={isUpdating || isDeleting}
              className="w-8 h-8 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-600 transition-colors shadow-sm"
              title="프로젝트 삭제"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Project Content */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            {/* Project Title - Editable */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="w-full px-3 py-2 text-lg font-semibold border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="프로젝트 이름을 입력하세요"
                    maxLength={200}
                    disabled={isUpdating}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditSave}
                      disabled={isUpdating || !editTitle.trim()}
                      className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {isUpdating ? (
                        <>
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          저장 중...
                        </>
                      ) : (
                        '저장'
                      )}
                    </button>
                    <button
                      onClick={handleEditCancel}
                      disabled={isUpdating}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <h2 className="text-lg font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={handleEditStart}>
                  {project.title || 'Untitled Project'}
                </h2>
              )}
            </div>
            
            <div className="flex-shrink-0 ml-3">
              {project.subtitles ? (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              ) : (
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {new Date(project.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>

          {/* Project Stats */}
          <div className="flex items-center gap-4 mb-6 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2" />
              </svg>
              <span>{project.subtitles ? Array.isArray(project.subtitles) ? project.subtitles.length : '0' : '0'} 자막</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span>한국어</span>
            </div>
          </div>

          {/* Action Button */}
          <Link href={`/project/${project.id}`}>
            <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
              프로젝트 보기
            </button>
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        project={project}
        isDeleting={isDeleting}
      />
    </>
  );
}