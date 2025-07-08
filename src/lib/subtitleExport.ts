interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

// Convert seconds to SRT time format (HH:MM:SS,mmm)
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.round((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}

// Convert seconds to VTT time format (HH:MM:SS.mmm)
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.round((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

// Generate SRT format subtitle content
export function generateSRT(subtitles: SubtitleSegment[]): string {
  let srtContent = '';
  
  subtitles.forEach((subtitle, index) => {
    const startTime = formatSRTTime(subtitle.startTime);
    const endTime = formatSRTTime(subtitle.endTime);
    
    srtContent += `${index + 1}\n`;
    srtContent += `${startTime} --> ${endTime}\n`;
    srtContent += `${subtitle.text}\n\n`;
  });
  
  return srtContent.trim();
}

// Generate VTT format subtitle content
export function generateVTT(subtitles: SubtitleSegment[]): string {
  let vttContent = 'WEBVTT\n\n';
  
  subtitles.forEach((subtitle) => {
    const startTime = formatVTTTime(subtitle.startTime);
    const endTime = formatVTTTime(subtitle.endTime);
    
    vttContent += `${startTime} --> ${endTime}\n`;
    vttContent += `${subtitle.text}\n\n`;
  });
  
  return vttContent.trim();
}

// Download file function
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

// Download video file from URL
export async function downloadVideoFile(videoUrl: string, filename: string): Promise<void> {
  try {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch video file');
    }
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading video:', error);
    throw error;
  }
}

// Export video with subtitles (SRT format only)
export async function exportVideoWithSubtitles(
  videoUrl: string, 
  subtitles: SubtitleSegment[], 
  projectTitle: string,
  viewMode?: 'translation' | 'original' | 'both'
): Promise<void> {
  const baseFilename = projectTitle || 'video_project';
  
  try {
    // Download video file
    const videoExtension = videoUrl.split('.').pop() || 'mp4';
    await downloadVideoFile(videoUrl, `${baseFilename}.${videoExtension}`);
    
    // Download SRT subtitle file based on view mode
    if (subtitles.length > 0) {
      const srtContent = generateSRTByMode(subtitles, viewMode || 'translation');
      const suffix = viewMode === 'original' ? '_original' : viewMode === 'both' ? '_both' : '';
      downloadFile(srtContent, `${baseFilename}${suffix}.srt`, 'text/plain');
    }
  } catch (error) {
    console.error('Error exporting video with subtitles:', error);
    throw error;
  }
}

// Generate SRT content based on view mode
export function generateSRTByMode(subtitles: SubtitleSegment[], viewMode: 'translation' | 'original' | 'both'): string {
  let srtContent = '';
  
  subtitles.forEach((subtitle, index) => {
    const startTime = formatSRTTime(subtitle.startTime);
    const endTime = formatSRTTime(subtitle.endTime);
    
    srtContent += `${index + 1}\n`;
    srtContent += `${startTime} --> ${endTime}\n`;
    
    switch (viewMode) {
      case 'translation':
        srtContent += `${subtitle.text}\n\n`;
        break;
      case 'original':
        srtContent += `${subtitle.originalText || subtitle.text}\n\n`;
        break;
      case 'both':
        srtContent += `${subtitle.text}\n`;
        if (subtitle.originalText) {
          srtContent += `${subtitle.originalText}\n`;
        }
        srtContent += `\n`;
        break;
    }
  });
  
  return srtContent.trim();
}
