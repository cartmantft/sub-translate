# Issue #1: Subtitle Download Button UI/UX Improvement

**GitHub Issue:** https://github.com/cartmantft/sub-translate/issues/1

## Problem Analysis

The current subtitle download section uses two large, separate buttons (Download SRT, Download VTT) that:
- Take up excessive screen space 
- Break design consistency with the recently completed UI/UX overhaul
- Use prominent blue/green colors that draw too much attention

## Current Implementation

**File:** `/src/components/SubtitleExportButtons.tsx`
- Two full-width buttons with different background colors
- Rendered in both MainContent.tsx and ProjectPageContent.tsx
- Positioned under "자막 다운로드" (Subtitle Download) section heading

## Proposed Solution

Replace the two large buttons with:
1. **Single compact icon button** with download icon
2. **Dropdown menu** that appears on click with SRT/VTT options
3. **Consistent styling** with the existing design system

## Implementation Plan

### Phase 1: Create Dropdown Component (30 min)
- [ ] Create reusable `DropdownMenu` component
- [ ] Implement click-outside-to-close functionality
- [ ] Style with Tailwind to match existing design system

### Phase 2: Create Download Icon Button (20 min)  
- [ ] Create SVG download icon (inline, matching existing pattern)
- [ ] Create compact button component
- [ ] Add hover effects and accessibility features

### Phase 3: Refactor SubtitleExportButtons (20 min)
- [ ] Replace existing button implementation
- [ ] Integrate new dropdown with download icon
- [ ] Maintain existing download functionality (SRT/VTT)
- [ ] Preserve existing props interface

### Phase 4: Testing & Verification (15 min)
- [ ] Test dropdown functionality (open/close)
- [ ] Test download functionality for both formats
- [ ] Verify visual consistency with design system
- [ ] Test on both MainContent and ProjectPageContent pages

## Technical Decisions

1. **No External Dependencies**: Continue using inline SVG icons to maintain current patterns
2. **Tailwind Styling**: Use existing Tailwind classes for consistency
3. **Component Structure**: Keep existing SubtitleExportButtons component interface
4. **Accessibility**: Include proper ARIA labels and keyboard navigation

## Files to Modify

1. `/src/components/SubtitleExportButtons.tsx` - Main component refactor
2. Create `/src/components/DropdownMenu.tsx` - Reusable dropdown component

## Expected Outcome

- More compact and elegant download UI
- Better visual hierarchy and page balance
- Consistent with professional design system
- No functional regression in download capabilities