'use client';

import React, { useState } from 'react';

interface SubtitleSegment {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

interface SubtitleEditorProps {
  initialSubtitles: SubtitleSegment[];
  onSubtitlesChange?: (subtitles: SubtitleSegment[]) => void;
}

const SubtitleEditor: React.FC<SubtitleEditorProps> = ({
  initialSubtitles,
  onSubtitlesChange,
}) => {
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>(initialSubtitles);

  const handleTextChange = (id: string, newText: string) => {
    const updatedSubtitles = subtitles.map((segment) =>
      segment.id === id ? { ...segment, text: newText } : segment
    );
    setSubtitles(updatedSubtitles);
    if (onSubtitlesChange) {
      onSubtitlesChange(updatedSubtitles);
    }
  };

  const handleTimeChange = (id: string, field: 'startTime' | 'endTime', newTime: number) => {
    const updatedSubtitles = subtitles.map((segment) =>
      segment.id === id ? { ...segment, [field]: newTime } : segment
    );
    setSubtitles(updatedSubtitles);
    if (onSubtitlesChange) {
      onSubtitlesChange(updatedSubtitles);
    }
  };

  const addSegment = () => {
    const newSegment: SubtitleSegment = {
      id: String(Date.now()), // Simple unique ID
      startTime: subtitles.length > 0 ? subtitles[subtitles.length - 1].endTime : 0,
      endTime: subtitles.length > 0 ? subtitles[subtitles.length - 1].endTime + 5 : 5, // 5 seconds default
      text: '',
    };
    const updatedSubtitles = [...subtitles, newSegment];
    setSubtitles(updatedSubtitles);
    if (onSubtitlesChange) {
      onSubtitlesChange(updatedSubtitles);
    }
  };

  const deleteSegment = (id: string) => {
    const updatedSubtitles = subtitles.filter((segment) => segment.id !== id);
    setSubtitles(updatedSubtitles);
    if (onSubtitlesChange) {
      onSubtitlesChange(updatedSubtitles);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg shadow-md bg-white">
      <button
        onClick={addSegment}
        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 font-semibold"
      >
        Add New Segment
      </button>

      {subtitles.length === 0 && (
        <p className="text-gray-500 italic text-center py-4">
          No subtitles to display. Click &quot;Add New Segment&quot; to start.
        </p>
      )}

      <div className="space-y-3">
        {subtitles.map((segment) => (
          <div
            key={segment.id}
            className="border border-gray-200 p-3 rounded-md flex flex-col md:flex-row md:items-center md:space-x-3 bg-gray-50 shadow-sm"
          >
            <div className="flex-grow mb-2 md:mb-0">
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md resize-y focus:ring-blue-400 focus:border-blue-400 text-gray-800"
                value={segment.text}
                onChange={(e) => handleTextChange(segment.id, e.target.value)}
                rows={2}
                placeholder="Enter subtitle text"
              />
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <input
                type="number"
                className="w-24 p-2 border border-gray-300 rounded-md text-gray-700"
                value={segment.startTime}
                onChange={(e) =>
                  handleTimeChange(segment.id, 'startTime', parseFloat(e.target.value))
                }
                step="0.01"
                title="Start Time (seconds)"
              />
              <span className="text-gray-600">-</span>
              <input
                type="number"
                className="w-24 p-2 border border-gray-300 rounded-md text-gray-700"
                value={segment.endTime}
                onChange={(e) =>
                  handleTimeChange(segment.id, 'endTime', parseFloat(e.target.value))
                }
                step="0.01"
                title="End Time (seconds)"
              />
              <button
                onClick={() => deleteSegment(segment.id)}
                className="px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-md hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 font-semibold"
                title="Delete Segment"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubtitleEditor;
