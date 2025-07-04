import { test, expect } from './fixtures/auth.fixture';

test.describe('Allotment 드래그 기능 디버그', () => {
  test('프로젝트 페이지에서 Allotment 컴포넌트 확인', async ({ authenticatedPage }) => {
    // 테스트 프로젝트 ID (로그에서 확인된 것)
    const projectId = '6c7639ab-82c9-4ebd-92b7-27e8cb6aca9c';
    
    // 프로젝트 상세페이지로 이동
    await authenticatedPage.goto(`/project/${projectId}`);
    
    // 페이지 로드 대기
    await authenticatedPage.waitForLoadState('networkidle');
    
    // 스크린샷으로 현재 상태 확인
    await authenticatedPage.screenshot({ path: 'debug-project-page.png' });
    
    // Allotment 컴포넌트 존재 확인
    const allotmentContainer = authenticatedPage.locator('.allotment');
    const allotmentCount = await allotmentContainer.count();
    console.log('Allotment container count:', allotmentCount);
    
    if (allotmentCount > 0) {
      // resizer(구분선) 존재 확인  
      const resizer = authenticatedPage.locator('.allotment-separator');
      const resizerCount = await resizer.count();
      console.log('Resizer count:', resizerCount);
      
      if (resizerCount > 0) {
        // CSS 스타일 확인
        const resizerStyles = await resizer.first().evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            display: computed.display,
            width: computed.width,
            height: computed.height,
            cursor: computed.cursor,
            backgroundColor: computed.backgroundColor,
            position: computed.position,
            pointerEvents: computed.pointerEvents
          };
        });
        console.log('Resizer styles:', resizerStyles);
        
        // Bounding box 확인
        const boundingBox = await resizer.first().boundingBox();
        console.log('Resizer bounding box:', boundingBox);
        
        // 드래그 테스트 시도
        if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
          console.log('Attempting drag test...');
          const startX = boundingBox.x + boundingBox.width / 2;
          const startY = boundingBox.y + boundingBox.height / 2;
          const endX = startX + 100; // 100px 우측으로 드래그
          
          await authenticatedPage.mouse.move(startX, startY);
          await authenticatedPage.mouse.down();
          await authenticatedPage.mouse.move(endX, startY);
          await authenticatedPage.mouse.up();
          
          console.log(`Drag attempted from (${startX}, ${startY}) to (${endX}, ${startY})`);
          
          // 드래그 후 스크린샷
          await authenticatedPage.screenshot({ path: 'debug-after-drag.png' });
        } else {
          console.log('Resizer has no valid bounding box - cannot perform drag');
        }
      } else {
        console.log('No resizer found!');
      }
      
      // DOM 구조 확인
      const allotmentHTML = await allotmentContainer.first().innerHTML();
      console.log('Allotment HTML structure length:', allotmentHTML.length);
      console.log('Allotment HTML preview:', allotmentHTML.substring(0, 500));
    } else {
      console.log('No Allotment container found!');
      
      // 전체 페이지 HTML 확인
      const bodyHTML = await authenticatedPage.locator('body').innerHTML();
      console.log('Page body HTML length:', bodyHTML.length);
      
      // 에러가 있는지 확인
      const errors = await authenticatedPage.locator('[data-testid*="error"], .error, [class*="error"]').count();
      console.log('Error elements found:', errors);
    }
    
    // 현재 URL 확인
    const currentURL = authenticatedPage.url();
    console.log('Current URL:', currentURL);
  });
});