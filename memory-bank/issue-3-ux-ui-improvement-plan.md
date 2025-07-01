# Issue #3: Landing Page UX/UI Improvement Plan

**Issue Link:** https://github.com/[repo]/issues/3
**Created:** 2025-07-01
**Priority:** High - User Experience Critical

## Problem Summary

현재 랜딩 페이지의 UX/UI가 사용자가 서비스를 처음 접했을 때 직관적으로 사용 흐름을 파악하기 어려운 문제가 있습니다. 동영상 업로드부터 자막 생성, 번역, 최종 결과물 다운로드까지의 과정이 명확하게 안내되지 않아 사용자 이탈 가능성이 높습니다.

## Key User Pain Points

1. **업로드 프로세스 불명확**
   - 파일 선택 후 Upload 버튼을 눌러야 하는지 불분명
   - 드래그 앤 드롭 기능 없음
   - 업로드 진행상황 표시 부재

2. **자막 처리 과정 비가시화**
   - 처리 중 어떤 단계인지 알 수 없음
   - 예상 소요시간 안내 없음
   - 진행률 표시 없음

3. **다운로드 기능 불명확**
   - 자막 다운로드 옵션이 눈에 띄지 않음
   - 다양한 형식 지원 여부 불분명

4. **추가 개선사항**
   - 대시보드 역할 설명 부재
   - 시각적 계층구조 개선 필요
   - UI 일관성 문제 (버튼 색상 등)

## Implementation Plan

### Phase 1: Video Upload Process Enhancement
1. **Drag & Drop Implementation**
   - FileUploader 컴포넌트에 드래그 앤 드롭 기능 추가
   - "파일을 이곳에 드래그하거나 클릭하여 업로드" 안내 문구
   - 드롭 영역 시각적 피드백 (hover 효과)

2. **Upload Progress Visualization**
   - 파일 선택 시 파일명과 크기 표시
   - 업로드 진행률 표시 (progress bar)
   - 업로드 버튼 상태 관리 개선

### Phase 2: Process Visualization
1. **Step Indicator Component**
   - 새로운 StepIndicator 컴포넌트 생성
   - 단계: 업로드 → 음성인식 → 번역 → 완료
   - 각 단계별 상태 표시 (대기/진행중/완료)

2. **Real-time Status Updates**
   - 각 API 호출 단계마다 상태 업데이트
   - 예상 소요시간 표시
   - 애니메이션 효과로 진행 상황 강조

### Phase 3: Download Section Improvement
1. **Prominent Download UI**
   - 완료 후 다운로드 섹션 강조
   - 다양한 형식 옵션 명시 (SRT, VTT)
   - 원클릭 다운로드 버튼

2. **Format Selection**
   - 드롭다운 메뉴로 형식 선택
   - 각 형식에 대한 간단한 설명

### Phase 4: Visual Hierarchy & Consistency
1. **Core Features Enhancement**
   - 아이콘 애니메이션 추가
   - 호버 효과 개선
   - 카드 레이아웃 시각적 강조

2. **Button Design System**
   - 일관된 버튼 색상 체계
   - Primary: 파란색 (주요 액션)
   - Secondary: 회색 (보조 액션)
   - Disabled 상태 명확히 구분

3. **Dashboard Tooltip**
   - 대시보드 메뉴에 호버 툴팁 추가
   - "저장된 프로젝트 관리" 설명

### Phase 5: Responsive & Polish
1. **Mobile Optimization**
   - 모바일에서도 드래그 앤 드롭 대체 UI
   - 터치 친화적 버튼 크기

2. **Micro-interactions**
   - 버튼 클릭 애니메이션
   - 로딩 스피너 개선
   - 성공/에러 메시지 애니메이션

## Technical Approach

### Components to Create/Modify:
1. **FileUploader.tsx** - 드래그 앤 드롭 기능 추가
2. **StepIndicator.tsx** (새 컴포넌트) - 프로세스 단계 표시
3. **MainContent.tsx** - 상태 관리 및 UI 개선
4. **page.tsx** - 대시보드 툴팁 추가

### State Management:
- 업로드 진행률 상태 추가
- 프로세스 단계 상태 관리
- 에러 상태 세분화

### API Integration:
- 진행 상황 실시간 업데이트
- 예상 시간 계산 로직

## Success Criteria

1. 사용자가 첫 방문에서 서비스 사용법을 직관적으로 이해
2. 각 단계에서 현재 상황을 명확히 파악 가능
3. 업로드부터 다운로드까지 끊김 없는 사용 경험
4. 모든 상호작용에 적절한 피드백 제공
5. 일관된 디자인 시스템 적용

## Testing Plan

1. **Unit Tests**
   - 드래그 앤 드롭 기능 테스트
   - 상태 전환 테스트
   - 에러 핸들링 테스트

2. **E2E Tests**
   - 전체 업로드-처리-다운로드 플로우
   - 에러 시나리오 테스트
   - 다양한 파일 형식 테스트

3. **UI/UX Testing**
   - 다양한 화면 크기에서 테스트
   - 접근성 테스트
   - 사용성 테스트 (직관성 검증)

## Implementation Order

1. FileUploader 드래그 앤 드롭 (High Priority)
2. StepIndicator 컴포넌트 생성 (High Priority)
3. 프로세스 상태 관리 개선 (High Priority)
4. 다운로드 섹션 UI 개선 (Medium Priority)
5. 버튼 디자인 시스템 (Medium Priority)
6. 대시보드 툴팁 (Low Priority)
7. 애니메이션 및 마이크로 인터랙션 (Low Priority)

## Notes

- 기존 디자인 시스템 (gradient, rounded corners) 유지
- 한국어 인터페이스 일관성 유지
- 모든 변경사항은 기존 기능을 해치지 않도록 주의
- 성능 최적화 고려 (특히 대용량 파일 업로드 시)