'use client';

/**
 * HTML5 Canvas를 사용한 비디오 썸네일 생성
 * FFmpeg.wasm 대신 브라우저 네이티브 기능 사용 (서버리스 환경 호환)
 */

/**
 * 비디오 파일에서 썸네일 생성 (HTML5 Canvas 사용)
 * @param videoFile - 입력 비디오 파일
 * @param options - 썸네일 생성 옵션
 * @returns Promise<Blob> - 생성된 썸네일 이미지 Blob
 */
export async function generateVideoThumbnail(
  videoFile: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    seekTime?: number; // 초 단위, 썸네일을 추출할 시점
    quality?: number; // 0-1, JPEG 품질
    maintainAspectRatio?: boolean; // 종횡비 유지 여부
  } = {}
): Promise<Blob> {
  const {
    maxWidth = 480,
    maxHeight = 360,
    seekTime = 1, // 1초 지점에서 추출
    quality = 0.9, // JPEG 품질 90% (적절한 품질)
    maintainAspectRatio = true, // 기본적으로 종횡비 유지
  } = options;

  return new Promise((resolve, reject) => {
    try {
      console.log('HTML5 Canvas 썸네일 생성 시작...');
      
      // 비디오 엘리먼트 생성
      const video = document.createElement('video');
      video.muted = true;
      video.crossOrigin = 'anonymous';
      
      // Canvas 엘리먼트 생성
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context를 생성할 수 없습니다.');
      }

      // 비디오 로드 완료 후 썸네일 생성
      video.addEventListener('loadeddata', () => {
        // 비디오 시간 설정 (요청된 시간, 단 비디오 길이를 초과하지 않음)
        const duration = video.duration;
        const optimalSeekTime = Math.min(seekTime, duration - 0.5); // 끝에서 0.5초 전까지
        console.log(`비디오 길이: ${duration}초, 썸네일 추출 시점: ${optimalSeekTime}초`);
        video.currentTime = optimalSeekTime;
      });

      video.addEventListener('seeked', () => {
        try {
          // 비디오 원본 크기 가져오기
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;
          
          console.log(`원본 비디오 크기: ${videoWidth}x${videoHeight}`);
          
          let canvasWidth, canvasHeight;
          
          if (maintainAspectRatio) {
            // 비디오 종횡비 계산
            const aspectRatio = videoWidth / videoHeight;
            
            // 숏폼(세로형) 비디오 감지 (높이가 폭보다 큰 경우)
            const isShortForm = aspectRatio < 1;
            
            if (isShortForm) {
              // 숏폼의 경우: 컨테이너는 고정 크기로
              console.log('숏폼 비디오 감지됨 (세로형)');
              canvasWidth = maxWidth;  // 컨테이너 너비는 고정
              canvasHeight = maxHeight; // 컨테이너 높이는 고정
            } else {
              // 일반 가로형 비디오: 기존 로직 유지
              if (aspectRatio > maxWidth / maxHeight) {
                // 가로가 더 긴 경우
                canvasWidth = maxWidth;
                canvasHeight = Math.round(maxWidth / aspectRatio);
              } else {
                // 세로가 더 긴 경우 (하지만 숏폼은 아닌)
                canvasHeight = maxHeight;
                canvasWidth = Math.round(maxHeight * aspectRatio);
              }
              console.log(`일반 비디오 썸네일 크기: ${canvasWidth}x${canvasHeight}`);
            }
          } else {
            // 종횡비 무시하고 고정 크기
            canvasWidth = maxWidth;
            canvasHeight = maxHeight;
          }
          
          console.log(`썸네일 크기: ${canvasWidth}x${canvasHeight}`);
          
          // Canvas 크기 설정 (고해상도)
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          
          // 고품질 렌더링을 위한 설정
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // 배경을 검은색으로 채우기
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          
          // 비디오 그리기 영역 계산
          const aspectRatio = videoWidth / videoHeight;
          const isShortForm = aspectRatio < 1;
          
          let drawX, drawY, drawWidth, drawHeight;
          
          if (isShortForm) {
            // 숏폼: 컨테이너 내에서 원본 비율 유지하며 중앙 배치
            drawHeight = canvasHeight;
            drawWidth = Math.round(drawHeight * aspectRatio);
            
            // 비디오가 컨테이너보다 넓으면 너비에 맞춤
            if (drawWidth > canvasWidth) {
              drawWidth = canvasWidth;
              drawHeight = Math.round(drawWidth / aspectRatio);
            }
            
            // 중앙 배치 계산
            drawX = Math.round((canvasWidth - drawWidth) / 2);
            drawY = Math.round((canvasHeight - drawHeight) / 2);
            
            console.log(`숏폼 그리기 영역: x=${drawX}, y=${drawY}, w=${drawWidth}, h=${drawHeight}`);
          } else {
            // 일반 비디오: 전체 캔버스 사용
            drawX = 0;
            drawY = 0;
            drawWidth = canvasWidth;
            drawHeight = canvasHeight;
          }
          
          // 비디오 프레임을 Canvas에 그리기 (고품질, 종횡비 유지)
          ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
          
          // Canvas를 Blob으로 변환
          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log(`HTML5 썸네일 생성 완료: ${blob.size} bytes (${canvasWidth}x${canvasHeight})`);
                
                // 리소스 정리
                video.remove();
                canvas.remove();
                
                resolve(blob);
              } else {
                reject(new Error('Canvas를 Blob으로 변환할 수 없습니다.'));
              }
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          reject(new Error(`썸네일 생성 중 오류: ${error}`));
        }
      });

      video.addEventListener('error', () => {
        reject(new Error('비디오 로드 실패: 지원되지 않는 형식이거나 손상된 파일일 수 있습니다.'));
      });

      // 비디오 파일 로드
      const videoURL = URL.createObjectURL(videoFile);
      video.src = videoURL;
      
      // 메모리 정리를 위한 cleanup
      video.addEventListener('loadstart', () => {
        URL.revokeObjectURL(videoURL);
      });
      
    } catch (error) {
      console.error('HTML5 썸네일 생성 실패:', error);
      reject(new Error('썸네일 생성에 실패했습니다. 비디오 파일을 확인해주세요.'));
    }
  });
}

/**
 * Blob을 Base64 데이터 URL로 변환
 * @param blob - 변환할 Blob 객체
 * @returns Promise<string> - Base64 데이터 URL
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Base64 변환 실패'));
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsDataURL(blob);
  });
}

/**
 * 비디오 파일에서 썸네일을 생성하고 Base64로 반환
 * @param videoFile - 입력 비디오 파일
 * @param options - 썸네일 생성 옵션
 * @returns Promise<string> - Base64 데이터 URL
 */
export async function generateThumbnailBase64(
  videoFile: File,
  options?: Parameters<typeof generateVideoThumbnail>[1]
): Promise<string> {
  const thumbnailBlob = await generateVideoThumbnail(videoFile, options);
  return await blobToBase64(thumbnailBlob);
}

/**
 * 썸네일 생성 기능이 지원되는지 확인
 */
export function isThumbnailSupported(): boolean {
  // HTML5 Canvas와 Video가 지원되는지 확인
  try {
    const canvas = document.createElement('canvas');
    const video = document.createElement('video');
    return !!(canvas.getContext && canvas.getContext('2d') && video.canPlayType);
  } catch (error) {
    return false;
  }
}

/**
 * 리소스 정리 (HTML5 Canvas는 자동 정리)
 */
export function cleanupCanvas(): void {
  console.log('HTML5 Canvas 리소스 정리 완료');
}