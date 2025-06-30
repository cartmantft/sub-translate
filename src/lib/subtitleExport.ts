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
