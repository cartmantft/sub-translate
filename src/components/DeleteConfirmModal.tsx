'use client';

import { Project } from '@/types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  project: Project | null;
  isDeleting: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  project,
  isDeleting
}: DeleteConfirmModalProps) {
  if (!isOpen || !project) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!isDeleting) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">프로젝트 삭제</h3>
            <p className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다</p>
          </div>
        </div>

        {/* Project Information */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                {project.title || 'Untitled Project'}
              </h4>
              <p className="text-sm text-gray-500">
                생성일: {new Date(project.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800 mb-1">다음 항목들이 영구적으로 삭제됩니다:</p>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 프로젝트 데이터 및 설정</li>
                <li>• 업로드된 비디오 파일</li>
                <li>• 생성된 자막 및 번역</li>
                <li>• 썸네일 이미지</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                삭제 중...
              </>
            ) : (
              '삭제하기'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}