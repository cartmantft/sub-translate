import { FullConfig } from '@playwright/test';
import { TestDataSeeder } from '../utils/test-data';
import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 글로벌 테스트 정리 시작...');
  
  try {
    // 1. 테스트 데이터 정리
    await cleanupTestData();
    
    // 2. 테스트 결과 아카이브
    await archiveTestResults();
    
    // 3. 리소스 정리
    await cleanupResources();
    
    // 4. 최종 정리 보고서 생성
    await generateCleanupReport();
    
    console.log('✅ 글로벌 정리 완료');
    
  } catch (error) {
    console.error('❌ 글로벌 정리 중 오류:', error);
    // 정리 과정에서 오류가 발생해도 테스트 실행을 중단하지 않음
  }
}

async function cleanupTestData() {
  console.log('🗑️ 테스트 데이터 정리...');
  
  try {
    const seeder = new TestDataSeeder();
    
    // 모든 테스트 데이터 정리
    await seeder.cleanupAllTestData();
    
    // 오래된 테스트 데이터 정리 (7일 이상)
    await seeder.cleanupOldTestData(7);
    
    console.log('✅ 테스트 데이터 정리 완료');
  } catch (error) {
    console.error('❌ 테스트 데이터 정리 실패:', error);
  }
}

async function archiveTestResults() {
  console.log('📦 테스트 결과 아카이브...');
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveDir = path.join('test-results', 'archives', timestamp);
    
    // 아카이브 디렉토리 생성
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }
    
    // 현재 테스트 결과 파일들 이동
    const resultFiles = [
      'test-results/results.json',
      'test-results/test-report.html',
      'test-results/detailed-report.md',
      'test-results/performance-report.json'
    ];
    
    for (const file of resultFiles) {
      if (fs.existsSync(file)) {
        const fileName = path.basename(file);
        const archivePath = path.join(archiveDir, fileName);
        fs.copyFileSync(file, archivePath);
      }
    }
    
    // 스크린샷과 비디오도 아카이브 (용량 고려하여 선택적)
    if (process.env.ARCHIVE_MEDIA === 'true') {
      await archiveMediaFiles(archiveDir);
    }
    
    console.log(`✅ 테스트 결과 아카이브 완료: ${archiveDir}`);
  } catch (error) {
    console.error('❌ 테스트 결과 아카이브 실패:', error);
  }
}

async function archiveMediaFiles(archiveDir: string) {
  const mediaDir = path.join(archiveDir, 'media');
  
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }
  
  // 스크린샷 아카이브
  const screenshotDir = 'test-results/screenshots';
  if (fs.existsSync(screenshotDir)) {
    copyDirectoryRecursive(screenshotDir, path.join(mediaDir, 'screenshots'));
  }
  
  // 비디오 아카이브
  const videoDir = 'test-results/videos';
  if (fs.existsSync(videoDir)) {
    copyDirectoryRecursive(videoDir, path.join(mediaDir, 'videos'));
  }
}

function copyDirectoryRecursive(source: string, target: string) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  const files = fs.readdirSync(source);
  
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectoryRecursive(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

async function cleanupResources() {
  console.log('🧽 리소스 정리...');
  
  try {
    // 임시 파일 정리
    await cleanupTempFiles();
    
    // 오래된 로그 파일 정리
    await cleanupLogFiles();
    
    // 캐시 파일 정리
    await cleanupCacheFiles();
    
    console.log('✅ 리소스 정리 완료');
  } catch (error) {
    console.error('❌ 리소스 정리 실패:', error);
  }
}

async function cleanupTempFiles() {
  const tempDirs = [
    'test-results/temp',
    '.playwright/temp',
    'uploads/temp'
  ];
  
  for (const dir of tempDirs) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`🗑️ 임시 디렉토리 정리: ${dir}`);
    }
  }
}

async function cleanupLogFiles() {
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7일
  const now = Date.now();
  
  const logDirs = ['logs', 'test-results/logs'];
  
  for (const logDir of logDirs) {
    if (!fs.existsSync(logDir)) continue;
    
    const files = fs.readdirSync(logDir);
    
    for (const file of files) {
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ 오래된 로그 파일 삭제: ${filePath}`);
      }
    }
  }
}

async function cleanupCacheFiles() {
  const cacheDirs = [
    '.next/cache',
    'node_modules/.cache',
    '.playwright/cache'
  ];
  
  for (const dir of cacheDirs) {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`🗑️ 캐시 디렉토리 정리: ${dir}`);
      } catch (error) {
        // 캐시 정리 실패는 무시
        console.log(`⚠️ 캐시 정리 실패 (무시): ${dir}`);
      }
    }
  }
}

async function generateCleanupReport() {
  console.log('📋 정리 보고서 생성...');
  
  try {
    const reportPath = path.join('test-results', 'cleanup-report.md');
    
    const report = `# 테스트 정리 보고서

## 정리 완료 시간
${new Date().toLocaleString()}

## 정리 항목
- ✅ 테스트 데이터 정리
- ✅ 테스트 결과 아카이브
- ✅ 임시 파일 정리
- ✅ 로그 파일 정리
- ✅ 캐시 파일 정리

## 디스크 사용량
${await getDiskUsage()}

## 다음 실행을 위한 준비사항
- 테스트 환경이 깨끗하게 정리되었습니다
- 다음 테스트 실행 시 새로운 데이터로 시작할 수 있습니다
- 아카이브된 결과는 test-results/archives에서 확인할 수 있습니다

---
*이 보고서는 자동으로 생성되었습니다.*
`;

    fs.writeFileSync(reportPath, report);
    console.log(`✅ 정리 보고서 생성: ${reportPath}`);
  } catch (error) {
    console.error('❌ 정리 보고서 생성 실패:', error);
  }
}

async function getDiskUsage(): Promise<string> {
  try {
    const testResultsDir = 'test-results';
    
    if (!fs.existsSync(testResultsDir)) {
      return '테스트 결과 디렉토리가 존재하지 않습니다.';
    }
    
    const totalSize = calculateDirectorySize(testResultsDir);
    const sizeInMB = (totalSize / 1024 / 1024).toFixed(2);
    
    return `테스트 결과 디렉토리 크기: ${sizeInMB} MB`;
  } catch (error) {
    return '디스크 사용량 계산 실패';
  }
}

function calculateDirectorySize(dirPath: string): number {
  let totalSize = 0;
  
  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += calculateDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
  } catch (error) {
    // 접근 권한 등의 문제로 계산할 수 없는 경우 무시
  }
  
  return totalSize;
}

export default globalTeardown;