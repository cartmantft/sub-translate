# Issue #23: Subtitle Editor Enhancement Plan

**GitHub Issue**: [#23 - [UI/UX] 상세 페이지 자막 편집기 기능 고도화 및 레이아웃 개선](https://github.com/user/sub-translate/issues/23)

## Overview

This issue focuses on transforming the current read-only subtitle viewer into a feature-rich inline editor with improved UX. The enhancement includes resizable panels, video thumbnails, inline editing, and a better view mode selector.

## Current State Analysis

### Existing Components
- **UnifiedSubtitleViewer.tsx**: Current read-only subtitle display with 3-tab view
- **ProjectPageContent.tsx**: Main container with fixed grid layout
- **SubtitleEditor.tsx**: Existing but unused component with basic editing features
- **VideoPlayer.tsx**: Works well, needs no changes

### Pain Points
1. No inline editing capability - users must go through separate editing process
2. Fixed layout prevents users from adjusting workspace to their preference
3. Tab-based view selector requires multiple clicks to find desired view
4. No visual context (thumbnails) for subtitle segments
5. No save functionality integrated into the detail page

## Implementation Strategy

### Phase 1: Layout Foundation
1. **Install Allotment library** for resizable split panels
   - Better than react-split-pane for React 18+ compatibility
   - Supports min/max constraints (30%-70% as per requirements)
   
2. **Update ProjectPageContent layout**
   - Replace grid layout with Allotment split container
   - Configure panel constraints
   - Preserve existing time synchronization logic

### Phase 2: Core Components
1. **VideoThumbnail Component**
   - Use HTML5 Canvas API to capture video frames
   - Cache thumbnails for performance
   - Handle loading states gracefully
   
2. **EnhancedSubtitleEditor Component**
   - Build on existing SubtitleEditor.tsx structure
   - Integrate segment control UI (replace tabs)
   - Implement scrolling sync with video playback
   
3. **Segment Control Component**
   - Three options: Translation (번역), Original (원본), All (모두 보기)
   - Clean segmented button design matching wireframe
   - State management for active view mode

### Phase 3: Editing Features
1. **Inline Editing**
   - Click-to-edit textarea activation
   - Auto-resize textareas based on content
   - Track dirty state for unsaved changes
   
2. **State Management**
   - Local state for edited subtitles
   - Dirty tracking per segment
   - Global save state indicator

### Phase 4: Backend Integration
1. **API Route Enhancement**
   - Add PATCH method to `/api/projects/[id]/route.ts`
   - Validate subtitle format and timing
   - Update database with transaction support
   
2. **Save Functionality**
   - Batch updates for performance
   - Optimistic UI updates
   - Error handling with rollback

## Technical Decisions

### Why Allotment over react-split-pane?
- Better TypeScript support
- More active maintenance
- Smoother resize performance
- Built-in min/max constraints

### Thumbnail Generation Approach
- Client-side generation using Canvas API
- Lazy loading with intersection observer
- Cache in memory with LRU strategy
- Fallback to placeholder on error

### State Management Strategy
- Component-level state for UI interactions
- Context for subtitle edits and dirty tracking
- Server state sync on save action only
- Preserve undo/redo capability for future enhancement

## File Structure

```
src/
├── components/
│   ├── EnhancedSubtitleEditor.tsx    (new)
│   ├── VideoThumbnail.tsx            (new)
│   ├── SegmentControl.tsx            (new)
│   ├── ProjectPageContent.tsx        (modify)
│   └── UnifiedSubtitleViewer.tsx     (keep for reference)
├── app/
│   └── api/
│       └── projects/
│           └── [id]/
│               └── route.ts          (modify - add PATCH)
└── hooks/
    └── useSubtitleEditor.ts          (new - optional)
```

## Testing Strategy

1. **Unit Tests**
   - Thumbnail generation logic
   - Subtitle validation functions
   - State management hooks

2. **Integration Tests (Playwright)**
   - Panel resize functionality
   - Inline editing workflow
   - Save and persist flow
   - View mode switching
   - Error scenarios

3. **Accessibility Tests**
   - Keyboard navigation
   - Screen reader support
   - Focus management

## Rollout Plan

1. Create feature branch from latest main
2. Implement in phases with commits after each phase
3. Manual testing at each phase
4. Playwright tests for critical paths
5. Code review focusing on:
   - Performance (thumbnail generation)
   - State management correctness
   - API security
   - UI/UX consistency

## Success Metrics

- All acceptance criteria from issue #23 met
- No performance regression (measure with Playwright)
- Positive user feedback on editing experience
- Zero data loss scenarios in testing

## Risk Mitigation

1. **Performance Risk**: Thumbnail generation
   - Mitigation: Lazy loading, caching, web workers if needed

2. **Data Loss Risk**: Unsaved changes
   - Mitigation: Dirty state warnings, auto-save draft option

3. **Browser Compatibility**: Canvas API usage
   - Mitigation: Feature detection, graceful degradation

## Next Steps

1. Create feature branch
2. Install dependencies (Allotment)
3. Start with layout changes (lowest risk)
4. Build components incrementally
5. Add tests alongside implementation