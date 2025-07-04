'use client';

import { Allotment } from 'allotment';
import 'allotment/dist/style.css';

export default function TestAllotmentPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Allotment 테스트 페이지</h1>
      <p className="mb-4">아래 구분선을 드래그해서 크기를 조절해보세요:</p>
      
      <div className="border border-gray-300 h-96">
        <Allotment minSize={200}>
          <div className="h-full bg-blue-100 p-4 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-lg font-semibold">왼쪽 패널</h2>
              <p>이 패널의 크기를 조절해보세요</p>
            </div>
          </div>
          <div className="h-full bg-green-100 p-4 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-lg font-semibold">오른쪽 패널</h2>
              <p>드래그가 작동하나요?</p>
            </div>
          </div>
        </Allotment>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>✅ 드래그가 작동하면: Allotment 라이브러리는 정상</p>
        <p>❌ 드래그가 안 되면: 라이브러리 설정 문제</p>
        <p className="mt-2 font-semibold">🔧 디버그: F12 개발자 도구를 열어서 확인해보세요:</p>
        <ul className="text-xs mt-1 ml-4">
          <li>• Elements 탭에서 .allotment-separator 클래스가 있는지 확인</li>
          <li>• Console 탭에서 에러 메시지 확인</li>
          <li>• Network 탭에서 allotment CSS 파일이 로드되는지 확인</li>
        </ul>
      </div>
    </div>
  );
}