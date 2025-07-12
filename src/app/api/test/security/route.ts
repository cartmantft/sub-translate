import { NextResponse } from 'next/server';

/**
 * Security testing API endpoint
 * This endpoint is for testing our security implementations
 * DO NOT USE IN PRODUCTION
 */

export async function GET() {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }

  // 개발 환경에서만 실행되는 코드
  try {
    // 동적 import를 사용하여 개발 환경에서만 로드
    const { createClient } = await import('@/lib/supabase/server');
    const { logger } = await import('@/lib/utils/logger');
    const { validateUserStatus } = await import('@/lib/utils/user-validation');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const testResults = {
      currentUser: {
        id: user.id,
        email: user.email
      },
      tests: [] as Array<{ name: string; status: string; result?: unknown; error?: string; description: string }>
    };

    // Test 1: User validation function
    console.log('🧪 Testing user validation function...');
    try {
      const userStatus = await validateUserStatus(user.id);
      testResults.tests.push({
        name: 'User Status Validation',
        status: 'success',
        result: userStatus,
        description: 'Testing validateUserStatus function'
      });
    } catch (error) {
      testResults.tests.push({
        name: 'User Status Validation',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        description: 'Testing validateUserStatus function failed'
      });
    }

    logger.info('Security test completed', { 
      component: 'SecurityTest',
      action: 'GET',
      userId: user.id,
      testsRun: testResults.tests.length
    });

    return NextResponse.json({
      success: true,
      message: 'Security test completed successfully',
      results: testResults
    });

  } catch (error) {
    console.error('Security test failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during testing' },
      { status: 500 }
    );
  }
}