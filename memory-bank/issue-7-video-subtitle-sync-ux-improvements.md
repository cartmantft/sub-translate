# Issue #7: Video Player and Subtitle Viewer Synchronization & UX Improvements

**GitHub Issue:** [#7 - [UI/UX] 비디오 플레이어와 자막 뷰어 동기화 및 사용성 개선](https://github.com/cartmantft/sub-translate/issues/7)

## Problem Analysis

### Current Issues
1. **No Visual Feedback**: Current playing subtitle is not highlighted in the subtitle list
2. **Poor Progress Bar Visibility**: Video player's progress bar is barely visible (thin gray bar)
3. **Wrong Tab Order**: Text content tabs are in order: "원본 + 번역" → "원본만" → "번역만"
4. **Wrong Default Tab**: Default tab is "원본 + 번역" instead of "번역만"

### User Experience Impact
- Users cannot easily see which subtitle is currently playing
- Difficult to track video progress due to poor progress bar visibility
- Korean users (primary audience) have to click to get to translation, which should be default
- Tab order doesn't prioritize most important content (translation) first

## Technical Analysis

### Current Implementation State
- **VideoPlayer.tsx** (lines 21-126):
  - Tracks `currentTime` internally via `handleTimeUpdate()` (lines 34-38)
  - Has minimal progress bar styling (lines 109-119): `h-1 bg-gray-700` with blue fill
  - Uses `forwardRef` pattern for `jumpToTime` functionality
  - No `onTimeUpdate` prop to notify parent components

- **UnifiedSubtitleViewer.tsx** (lines 19-186):
  - Tab order: 'both' → 'original' → 'translated' (lines 57-105)
  - Default `activeTab` state is 'both' (line 24)
  - Accepts `onSegmentClick` prop but no `currentTime` prop
  - No highlighting logic for current subtitle

- **MainContent.tsx** (lines 268-285):
  - Uses responsive grid layout for video and subtitles
  - Passes `subtitles` and `onSegmentClick` to UnifiedSubtitleViewer
  - No current time tracking for synchronization

## Solution Requirements

### Acceptance Criteria
- ✅ Video playback highlights current subtitle in subtitle list
- ✅ Highlighted subtitle has distinct visual styling (background, border, etc.)
- ✅ Video player progress bar is more visible and accessible
- ✅ Text content tabs reordered to: "번역만" → "원본만" → "원본 + 번역"
- ✅ Default selected tab is "번역만" (translated)
- ✅ Existing subtitle click functionality (video jump) remains working
- ✅ Responsive layout from Issue #5 remains functional

## Technical Implementation Plan

### Phase 1: VideoPlayer Component Enhancement

#### 1.1 Add Time Update Callback
```tsx
// Add to VideoPlayerProps interface
interface VideoPlayerProps {
  src: string;
  subtitles?: SubtitleSegment[];
  onTimeUpdate?: (currentTime: number) => void; // NEW
}

// Modify handleTimeUpdate function
const handleTimeUpdate = () => {
  if (videoRef.current) {
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    onTimeUpdate?.(time); // NEW: Notify parent
  }
};
```

#### 1.2 Enhanced Progress Bar Styling
```tsx
// Current (line 111-118): thin gray bar
<div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
  <div className="h-full bg-blue-600 transition-all duration-100" />
</div>

// Enhanced: thicker, more visible, better colors
<div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-800 bg-opacity-75">
  <div className="h-full bg-blue-500 shadow-sm transition-all duration-100" />
</div>
```

### Phase 2: UnifiedSubtitleViewer Component Enhancement

#### 2.1 Add Current Time Prop and Highlighting Logic
```tsx
// Add to UnifiedSubtitleViewerProps interface
interface UnifiedSubtitleViewerProps {
  segments: SubtitleSegment[];
  onSegmentClick?: (startTime: number) => void;
  showOriginal?: boolean;
  currentTime?: number; // NEW
}

// Add function to find current subtitle
const getCurrentSubtitleIndex = (): number => {
  if (currentTime === undefined) return -1;
  return segments.findIndex(
    segment => currentTime >= segment.startTime && currentTime <= segment.endTime
  );
};
```

#### 2.2 Tab Reordering and Default Change
```tsx
// Change default activeTab from 'both' to 'translated'
const [activeTab, setActiveTab] = useState<'both' | 'original' | 'translated'>('translated');

// Reorder tabs in JSX (lines 57-105):
// New order: translated → original → both
<button onClick={() => setActiveTab('translated')}>번역만</button>
<button onClick={() => setActiveTab('original')}>원본만</button>  
<button onClick={() => setActiveTab('both')}>원본 + 번역</button>
```

#### 2.3 Current Subtitle Highlighting
```tsx
// Add highlighting styles to current subtitle
<div 
  key={segment.id}
  className={`group cursor-pointer p-4 rounded-xl border transition-all duration-200 ${
    getCurrentSubtitleIndex() === index
      ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200' // HIGHLIGHTED
      : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50'     // NORMAL
  }`}
  onClick={() => handleSegmentClick(segment.startTime)}
>
```

### Phase 3: MainContent Component Integration

#### 3.1 Add Current Time State and Callback
```tsx
// Add state for current video time
const [currentVideoTime, setCurrentVideoTime] = useState(0);

// Add callback handler
const handleVideoTimeUpdate = (time: number) => {
  setCurrentVideoTime(time);
};

// Update VideoPlayer props (line 275)
<VideoPlayer 
  ref={videoPlayerRef} 
  src={videoSrc} 
  onTimeUpdate={handleVideoTimeUpdate} // NEW
/>

// Update UnifiedSubtitleViewer props (lines 280-284)
<UnifiedSubtitleViewer 
  segments={subtitles}
  onSegmentClick={handleSubtitleClick}
  showOriginal={true}
  currentTime={currentVideoTime} // NEW
/>
```

## Testing Strategy

### Playwright E2E Tests Required
1. **Subtitle Highlighting Test**
   - Upload video, wait for processing
   - Play video and verify current subtitle gets highlighted
   - Verify highlighting updates as video progresses

2. **Tab Order and Default Test**
   - Verify "번역만" is selected by default
   - Verify tab order is: 번역만 → 원본만 → 원본+번역
   - Test tab switching functionality

3. **Enhanced Progress Bar Test**
   - Verify progress bar is more visible
   - Test progress bar updates during playback

4. **Existing Functionality Test**
   - Verify subtitle click still jumps to correct time
   - Verify responsive layout still works
   - Verify all existing upload and processing flows work

### Manual Testing Checklist
- [ ] Video uploads and processes correctly
- [ ] Subtitles are generated and displayed
- [ ] Current subtitle highlights during video playback
- [ ] Highlighting moves correctly as video progresses
- [ ] Progress bar is easily visible and updates smoothly
- [ ] Default tab is "번역만"
- [ ] Tab order is correct: 번역만 → 원본만 → 원본+번역
- [ ] Clicking subtitles still jumps video to correct time
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] All existing features continue to work

## Implementation Sequence

### Step 1: VideoPlayer Enhancement
1. Add `onTimeUpdate` prop to interface
2. Modify `handleTimeUpdate` to call parent callback
3. Enhance progress bar styling for better visibility
4. Test basic functionality

### Step 2: UnifiedSubtitleViewer Enhancement
1. Add `currentTime` prop to interface
2. Add `getCurrentSubtitleIndex()` function
3. Reorder tabs and change default to 'translated'
4. Add highlighting styles for current subtitle
5. Test highlighting logic

### Step 3: MainContent Integration
1. Add `currentVideoTime` state
2. Add `handleVideoTimeUpdate` callback
3. Pass new props to both components
4. Test full synchronization

### Step 4: Comprehensive Testing
1. Manual testing of all functionality
2. Playwright E2E test creation and execution
3. Cross-browser and device testing
4. Performance impact assessment

## Component Dependencies

```
MainContent.tsx
├── VideoPlayer.tsx (enhanced with onTimeUpdate)
├── UnifiedSubtitleViewer.tsx (enhanced with currentTime + highlighting)
└── SubtitleExportButtons.tsx (unchanged)
```

## Expected Outcomes

### User Experience Improvements
- ✅ Clear visual feedback showing current subtitle during playback
- ✅ Better video progress tracking with enhanced progress bar
- ✅ Korean translation prioritized as default view
- ✅ Logical tab ordering that matches user priority
- ✅ Maintained subtitle click functionality for time navigation

### Technical Benefits
- Real-time video-subtitle synchronization
- Clean component interface with proper prop passing
- Maintained responsive design from Issue #5
- No breaking changes to existing functionality
- Performance-optimized highlighting updates

## Implementation Notes

### Preserve Existing Patterns
- Keep `forwardRef` pattern for VideoPlayer
- Maintain existing responsive grid layout
- Keep all subtitle export functionality
- Preserve existing state management patterns

### Performance Considerations
- Use efficient subtitle index finding (single pass)
- Minimize re-renders with proper React patterns
- Maintain smooth video playback performance

### Accessibility
- Ensure highlighted subtitle has sufficient color contrast
- Maintain keyboard navigation functionality
- Keep ARIA labels and screen reader support