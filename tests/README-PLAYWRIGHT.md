# Playwright 테스트 가이드

## 설치 완료된 테스트

SubTranslate 앱에 대한 Playwright 테스트가 설정되었습니다.

### 테스트 파일들

1. **`tests/navigation.spec.ts`** - 페이지 네비게이션 테스트
   - 홈 → 로그인 페이지 이동
   - 로그인 → 홈 페이지 돌아가기
   - 네비게이션 링크 동작 확인

2. **`tests/login-ui.spec.ts`** - 로그인 페이지 UI 테스트
   - 기본 UI 요소 표시 확인
   - Supabase Auth 컴포넌트 확인
   - 소셜 로그인 버튼 확인
   - 스타일링 확인

3. **`tests/dashboard-access.spec.ts`** - 대시보드 접근 권한 테스트
   - 인증되지 않은 사용자 리다이렉트 확인
   - API 보호 확인
   - 프로젝트 페이지 접근 제한 확인

4. **`tests/responsive.spec.ts`** - 반응형 디자인 테스트
   - 모바일/태블릿/데스크톱 뷰포트 테스트
   - 터치 친화적 요소 크기 확인
   - 동적 뷰포트 변경 테스트

### 테스트 실행 명령어

```bash
# 모든 테스트 실행 (헤드리스 모드)
npm test

# UI 모드로 테스트 실행 (브라우저에서 시각적으로 확인)
npm run test:ui

# 헤드 모드로 테스트 실행 (브라우저 창 표시)
npm run test:headed
```

### 주의사항

- WSL 환경에서는 일부 시스템 라이브러리가 누락될 수 있습니다
- 테스트 실행 전에 개발 서버가 자동으로 시작됩니다 (`npm run dev`)
- 테스트는 `http://localhost:3000`에서 실행됩니다

### 테스트 추가하기

새로운 테스트를 추가하려면 `tests/` 폴더에 `.spec.ts` 파일을 생성하고 Playwright API를 사용하세요.

```typescript
import { test, expect } from '@playwright/test';

test('새로운 테스트', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('SubTranslate')).toBeVisible();
});
```