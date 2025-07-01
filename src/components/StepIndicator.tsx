'use client';

export type ProcessStep = 'upload' | 'transcribe' | 'translate' | 'complete';

interface Step {
  id: ProcessStep;
  name: string;
  description: string;
}

interface StepIndicatorProps {
  currentStep: ProcessStep;
  className?: string;
}

const steps: Step[] = [
  { id: 'upload', name: '업로드', description: '비디오 파일 업로드 중' },
  { id: 'transcribe', name: '음성 인식', description: 'AI가 음성을 텍스트로 변환 중' },
  { id: 'translate', name: '번역', description: '텍스트를 한국어로 번역 중' },
  { id: 'complete', name: '완료', description: '자막 생성 완료' },
];

export default function StepIndicator({ currentStep, className = '' }: StepIndicatorProps) {
  const getStepIndex = (step: ProcessStep) => steps.findIndex(s => s.id === step);
  const currentStepIndex = getStepIndex(currentStep);

  return (
    <div className={`w-full ${className}`}>
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, stepIdx) => {
            const isComplete = stepIdx < currentStepIndex;
            const isCurrent = stepIdx === currentStepIndex;
            const isUpcoming = stepIdx > currentStepIndex;

            return (
              <li key={step.id} className={stepIdx !== steps.length - 1 ? 'flex-1 pr-4' : ''}>
                <div className="group flex items-center">
                  <span className="flex items-center">
                    <span 
                      className={`
                        relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300
                        ${isComplete ? 'bg-blue-600' : ''}
                        ${isCurrent ? 'bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse' : ''}
                        ${isUpcoming ? 'bg-gray-300' : ''}
                      `}
                    >
                      {isComplete ? (
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isCurrent ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
                      ) : (
                        <span className="text-sm font-medium text-gray-500">{stepIdx + 1}</span>
                      )}
                    </span>
                  </span>
                  
                  <span className="ml-3 flex flex-col">
                    <span 
                      className={`text-sm font-medium transition-colors duration-300
                        ${isComplete || isCurrent ? 'text-gray-900' : 'text-gray-500'}
                      `}
                    >
                      {step.name}
                    </span>
                    {isCurrent && (
                      <span className="text-xs text-gray-500 mt-0.5">{step.description}</span>
                    )}
                  </span>

                  {stepIdx !== steps.length - 1 && (
                    <div className="ml-4 flex-1">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="h-0.5 w-full bg-gray-200" />
                        </div>
                        {isComplete && (
                          <div className="absolute inset-0 flex items-center">
                            <div className="h-0.5 w-full bg-blue-600 transition-all duration-700" />
                          </div>
                        )}
                        {isCurrent && (
                          <div className="absolute inset-0 flex items-center">
                            <div 
                              className="h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-700" 
                              style={{ width: '50%' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
      
      {/* Estimated time display */}
      {currentStep !== 'complete' && currentStep !== 'upload' && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            예상 소요 시간: <span className="font-medium">1-3분</span>
          </p>
        </div>
      )}
    </div>
  );
}