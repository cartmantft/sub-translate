/**
 * 커스텀 테스트 리포터
 */

import { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

export interface TestMetrics {
  testName: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number;
  browser: string;
  errors: string[];
  performance?: {
    pageLoadTime?: number;
    memoryUsage?: number;
    networkRequests?: number;
  };
}

export class CustomTestReporter implements Reporter {
  private results: TestMetrics[] = [];
  private startTime: number = 0;
  private outputDir: string;

  constructor(options: { outputDir?: string } = {}) {
    this.outputDir = options.outputDir || './test-results';
    this.ensureOutputDir();
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.startTime = Date.now();
    console.log(`🚀 테스트 시작: ${new Date().toLocaleString()}`);
    console.log(`📋 총 테스트 수: ${suite.allTests().length}`);
    console.log(`🔄 병렬 워커: ${config.workers}`);
    console.log('─'.repeat(80));
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const browserName = test.parent?.parent?.title || 'unknown';
    
    const metrics: TestMetrics = {
      testName: test.title,
      status: result.status,
      duration: result.duration,
      browser: browserName,
      errors: result.errors.map(error => error.message || ''),
    };

    // 성능 메트릭 추출 (콘솔 로그에서)
    this.extractPerformanceMetrics(result, metrics);
    
    this.results.push(metrics);

    // 실시간 진행 상황 표시
    this.printTestResult(metrics);
  }

  onEnd(result: FullResult) {
    const totalTime = Date.now() - this.startTime;
    
    // 결과 요약 출력
    this.printSummary(totalTime);
    
    // 상세 리포트 생성
    this.generateDetailedReport();
    
    // JSON 결과 파일 생성
    this.generateJSONReport();
    
    // HTML 리포트 생성
    this.generateHTMLReport();
    
    // 성능 리포트 생성
    this.generatePerformanceReport();
  }

  private ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private extractPerformanceMetrics(result: TestResult, metrics: TestMetrics) {
    // stdout에서 성능 메트릭 추출
    const stdout = result.stdout.join('');
    
    // 페이지 로딩 시간 추출
    const loadTimeMatch = stdout.match(/로딩 시간: (\d+)ms/);
    if (loadTimeMatch) {
      metrics.performance = metrics.performance || {};
      metrics.performance.pageLoadTime = parseInt(loadTimeMatch[1]);
    }

    // 메모리 사용량 추출
    const memoryMatch = stdout.match(/메모리.*?(\d+(?:\.\d+)?)MB/);
    if (memoryMatch) {
      metrics.performance = metrics.performance || {};
      metrics.performance.memoryUsage = parseFloat(memoryMatch[1]);
    }

    // 네트워크 요청 수 추출
    const networkMatch = stdout.match(/네트워크 요청: (\d+)/);
    if (networkMatch) {
      metrics.performance = metrics.performance || {};
      metrics.performance.networkRequests = parseInt(networkMatch[1]);
    }
  }

  private printTestResult(metrics: TestMetrics) {
    const statusIcon = this.getStatusIcon(metrics.status);
    const durationFormatted = this.formatDuration(metrics.duration);
    const browserFormatted = metrics.browser.padEnd(10);
    
    console.log(`${statusIcon} ${browserFormatted} ${durationFormatted} ${metrics.testName}`);
    
    if (metrics.errors.length > 0) {
      metrics.errors.forEach(error => {
        console.log(`   ❌ ${error}`);
      });
    }

    if (metrics.performance?.pageLoadTime) {
      console.log(`   ⏱️  로딩: ${metrics.performance.pageLoadTime}ms`);
    }
  }

  private printSummary(totalTime: number) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 테스트 결과 요약');
    console.log('='.repeat(80));

    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const timedOut = this.results.filter(r => r.status === 'timedOut').length;
    const total = this.results.length;

    console.log(`✅ 통과: ${passed}/${total}`);
    console.log(`❌ 실패: ${failed}/${total}`);
    console.log(`⏭️  건너뜀: ${skipped}/${total}`);
    console.log(`⏱️  타임아웃: ${timedOut}/${total}`);
    console.log(`🕐 총 소요 시간: ${this.formatDuration(totalTime)}`);

    // 성공률 계산
    const successRate = total > 0 ? (passed / total * 100).toFixed(1) : '0';
    console.log(`📈 성공률: ${successRate}%`);

    // 브라우저별 통계
    console.log('\n📱 브라우저별 결과:');
    const browserStats = this.getBrowserStats();
    Object.entries(browserStats).forEach(([browser, stats]) => {
      console.log(`   ${browser}: ${stats.passed}/${stats.total} (${stats.rate}%)`);
    });

    // 성능 통계
    this.printPerformanceStats();
  }

  private generateDetailedReport() {
    const reportPath = path.join(this.outputDir, 'detailed-report.md');
    
    let content = '# 상세 테스트 리포트\n\n';
    content += `생성 시간: ${new Date().toLocaleString()}\n\n`;
    
    // 실패한 테스트 상세 정보
    const failedTests = this.results.filter(r => r.status === 'failed');
    if (failedTests.length > 0) {
      content += '## ❌ 실패한 테스트\n\n';
      failedTests.forEach(test => {
        content += `### ${test.testName} (${test.browser})\n`;
        content += `- 소요 시간: ${this.formatDuration(test.duration)}\n`;
        test.errors.forEach(error => {
          content += `- 오류: ${error}\n`;
        });
        content += '\n';
      });
    }

    // 성능 이슈가 있는 테스트
    const slowTests = this.results.filter(r => r.duration > 10000);
    if (slowTests.length > 0) {
      content += '## 🐌 느린 테스트 (10초 이상)\n\n';
      slowTests.forEach(test => {
        content += `- ${test.testName} (${test.browser}): ${this.formatDuration(test.duration)}\n`;
      });
      content += '\n';
    }

    fs.writeFileSync(reportPath, content);
    console.log(`📋 상세 리포트 생성: ${reportPath}`);
  }

  private generateJSONReport() {
    const reportPath = path.join(this.outputDir, 'test-results.json');
    
    const report = {
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'passed').length,
        failed: this.results.filter(r => r.status === 'failed').length,
        skipped: this.results.filter(r => r.status === 'skipped').length,
        timedOut: this.results.filter(r => r.status === 'timedOut').length,
        generatedAt: new Date().toISOString(),
      },
      results: this.results,
      browserStats: this.getBrowserStats(),
      performanceStats: this.getPerformanceStats(),
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 JSON 리포트 생성: ${reportPath}`);
  }

  private generateHTMLReport() {
    const reportPath = path.join(this.outputDir, 'test-report.html');
    
    const html = this.generateHTMLContent();
    fs.writeFileSync(reportPath, html);
    console.log(`🌐 HTML 리포트 생성: ${reportPath}`);
  }

  private generatePerformanceReport() {
    const performanceTests = this.results.filter(r => r.performance);
    
    if (performanceTests.length === 0) return;

    const reportPath = path.join(this.outputDir, 'performance-report.json');
    
    const performanceReport = {
      summary: {
        totalTests: performanceTests.length,
        averageLoadTime: this.calculateAverage(performanceTests, 'pageLoadTime'),
        averageMemoryUsage: this.calculateAverage(performanceTests, 'memoryUsage'),
        generatedAt: new Date().toISOString(),
      },
      details: performanceTests.map(test => ({
        testName: test.testName,
        browser: test.browser,
        performance: test.performance,
        duration: test.duration,
      })),
      recommendations: this.generatePerformanceRecommendations(performanceTests),
    };

    fs.writeFileSync(reportPath, JSON.stringify(performanceReport, null, 2));
    console.log(`⚡ 성능 리포트 생성: ${reportPath}`);
  }

  private getBrowserStats() {
    const stats: { [browser: string]: { passed: number; total: number; rate: string } } = {};
    
    this.results.forEach(result => {
      if (!stats[result.browser]) {
        stats[result.browser] = { passed: 0, total: 0, rate: '0' };
      }
      
      stats[result.browser].total++;
      if (result.status === 'passed') {
        stats[result.browser].passed++;
      }
    });

    Object.keys(stats).forEach(browser => {
      const rate = (stats[browser].passed / stats[browser].total * 100).toFixed(1);
      stats[browser].rate = rate;
    });

    return stats;
  }

  private getPerformanceStats() {
    const performanceTests = this.results.filter(r => r.performance);
    
    return {
      averageLoadTime: this.calculateAverage(performanceTests, 'pageLoadTime'),
      averageMemoryUsage: this.calculateAverage(performanceTests, 'memoryUsage'),
      slowestTest: this.findSlowestTest(),
      fastestTest: this.findFastestTest(),
    };
  }

  private printPerformanceStats() {
    const stats = this.getPerformanceStats();
    
    console.log('\n⚡ 성능 통계:');
    if (stats.averageLoadTime > 0) {
      console.log(`   평균 로딩 시간: ${stats.averageLoadTime.toFixed(0)}ms`);
    }
    if (stats.averageMemoryUsage > 0) {
      console.log(`   평균 메모리 사용량: ${stats.averageMemoryUsage.toFixed(1)}MB`);
    }
    if (stats.slowestTest) {
      console.log(`   가장 느린 테스트: ${stats.slowestTest.name} (${this.formatDuration(stats.slowestTest.duration)})`);
    }
  }

  private calculateAverage(tests: TestMetrics[], metric: keyof NonNullable<TestMetrics['performance']>): number {
    const values = tests
      .filter(t => t.performance && t.performance[metric])
      .map(t => t.performance![metric] as number);
    
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  private findSlowestTest() {
    const slowest = this.results.reduce((prev, current) => 
      prev.duration > current.duration ? prev : current
    );
    
    return {
      name: slowest.testName,
      duration: slowest.duration,
      browser: slowest.browser,
    };
  }

  private findFastestTest() {
    const fastest = this.results.reduce((prev, current) => 
      prev.duration < current.duration ? prev : current
    );
    
    return {
      name: fastest.testName,
      duration: fastest.duration,
      browser: fastest.browser,
    };
  }

  private generatePerformanceRecommendations(tests: TestMetrics[]): string[] {
    const recommendations: string[] = [];
    
    const avgLoadTime = this.calculateAverage(tests, 'pageLoadTime');
    if (avgLoadTime > 3000) {
      recommendations.push('페이지 로딩 시간이 3초를 초과합니다. 성능 최적화를 고려해보세요.');
    }

    const avgMemoryUsage = this.calculateAverage(tests, 'memoryUsage');
    if (avgMemoryUsage > 100) {
      recommendations.push('메모리 사용량이 100MB를 초과합니다. 메모리 누수를 확인해보세요.');
    }

    const slowTests = tests.filter(t => t.duration > 30000);
    if (slowTests.length > 0) {
      recommendations.push(`${slowTests.length}개의 테스트가 30초를 초과합니다. 테스트 최적화가 필요합니다.`);
    }

    return recommendations;
  }

  private generateHTMLContent(): string {
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const total = this.results.length;
    const successRate = total > 0 ? (passed / total * 100).toFixed(1) : '0';

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>테스트 결과 리포트</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .test-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .test-table th, .test-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        .test-table th { background: #f8f9fa; font-weight: 600; }
        .status-passed { color: #28a745; }
        .status-failed { color: #dc3545; }
        .status-skipped { color: #ffc107; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 테스트 결과 리포트</h1>
        <p>생성 시간: ${new Date().toLocaleString()}</p>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="stat-value passed">${passed}</div>
            <div>통과</div>
        </div>
        <div class="stat-card">
            <div class="stat-value failed">${failed}</div>
            <div>실패</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${total}</div>
            <div>총 테스트</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${successRate}%</div>
            <div>성공률</div>
        </div>
    </div>

    <h2>📊 테스트 상세 결과</h2>
    <table class="test-table">
        <thead>
            <tr>
                <th>테스트명</th>
                <th>브라우저</th>
                <th>상태</th>
                <th>소요시간</th>
                <th>성능</th>
            </tr>
        </thead>
        <tbody>
            ${this.results.map(result => `
                <tr>
                    <td>${result.testName}</td>
                    <td>${result.browser}</td>
                    <td class="status-${result.status}">${this.getStatusText(result.status)}</td>
                    <td>${this.formatDuration(result.duration)}</td>
                    <td>${this.formatPerformanceInfo(result.performance)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>
    `;
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'skipped': return '⏭️';
      case 'timedOut': return '⏱️';
      default: return '❓';
    }
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'passed': return '통과';
      case 'failed': return '실패';
      case 'skipped': return '건너뜀';
      case 'timedOut': return '타임아웃';
      default: return '알 수 없음';
    }
  }

  private formatDuration(duration: number): string {
    if (duration < 1000) {
      return `${duration}ms`;
    } else {
      return `${(duration / 1000).toFixed(1)}s`;
    }
  }

  private formatPerformanceInfo(performance?: TestMetrics['performance']): string {
    if (!performance) return '-';
    
    const parts: string[] = [];
    if (performance.pageLoadTime) {
      parts.push(`로딩: ${performance.pageLoadTime}ms`);
    }
    if (performance.memoryUsage) {
      parts.push(`메모리: ${performance.memoryUsage.toFixed(1)}MB`);
    }
    
    return parts.join(', ') || '-';
  }
}