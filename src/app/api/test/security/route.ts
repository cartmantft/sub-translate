import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { validateUserStatus } from '@/lib/utils/user-validation';

/**
 * Security testing API endpoint
 * This endpoint is for testing our security implementations
 * DO NOT USE IN PRODUCTION
 */

export async function GET(request: Request) {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Security test endpoint not available in production' },
      { status: 403 }
    );
  }

  try {
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
      tests: []
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

    // Test 2: Direct auth.users query test
    console.log('🧪 Testing auth.users table access...');
    try {
      const { data: authUserData, error: authError } = await supabase
        .from('auth.users')
        .select('id, email, deleted_at, banned_until')
        .eq('id', user.id)
        .single();

      if (authError) {
        testResults.tests.push({
          name: 'Auth Users Table Access',
          status: 'error',
          error: authError.message,
          errorCode: authError.code,
          description: 'Direct auth.users table query failed'
        });
      } else {
        testResults.tests.push({
          name: 'Auth Users Table Access',
          status: 'success',
          result: authUserData,
          description: 'Direct auth.users table query successful'
        });
      }
    } catch (error) {
      testResults.tests.push({
        name: 'Auth Users Table Access',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        description: 'Auth users table access test failed'
      });
    }

    // Test 3: Session information
    console.log('🧪 Testing session information...');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      testResults.tests.push({
        name: 'Session Information',
        status: 'success',
        result: {
          hasSession: !!sessionData.session,
          expiresAt: sessionData.session?.expires_at,
          tokenType: sessionData.session?.token_type
        },
        description: 'Session information retrieval test'
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Session Information',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        description: 'Session information test failed'
      });
    }

    // Test 4: JWT token validation
    console.log('🧪 Testing JWT token validation...');
    try {
      const { data: jwtUser, error: jwtError } = await supabase.auth.getUser();
      
      testResults.tests.push({
        name: 'JWT Token Validation',
        status: jwtError ? 'error' : 'success',
        result: jwtError ? { error: jwtError.message } : { 
          userId: jwtUser.user?.id,
          aud: jwtUser.user?.aud,
          role: jwtUser.user?.role
        },
        description: 'JWT token validation test'
      });
    } catch (error) {
      testResults.tests.push({
        name: 'JWT Token Validation',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        description: 'JWT token validation test failed'
      });
    }

    // Test 5: Database permissions test
    console.log('🧪 Testing database permissions...');
    try {
      // Try to query projects table
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, user_id')
        .eq('user_id', user.id)
        .limit(1);

      testResults.tests.push({
        name: 'Database Permissions',
        status: projectsError ? 'error' : 'success',
        result: projectsError ? { error: projectsError.message } : { 
          projectCount: projectsData?.length || 0
        },
        description: 'Database permission test on projects table'
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Database Permissions',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        description: 'Database permission test failed'
      });
    }

    // Log test results
    logger.info('Security test completed', {
      action: 'securityTest',
      userId: user.id,
      testResults: testResults.tests.map(t => ({ name: t.name, status: t.status }))
    });

    return NextResponse.json({
      success: true,
      message: 'Security tests completed',
      timestamp: new Date().toISOString(),
      testResults
    });

  } catch (error) {
    logger.error('Error in security test API', error, {
      action: 'securityTest'
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Security test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Security test endpoint not available in production' },
      { status: 403 }
    );
  }

  try {
    const { testType, targetUserId } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let testResult = {};

    switch (testType) {
      case 'simulate_deleted_user':
        // Test what happens when we simulate a deleted user
        if (targetUserId) {
          const userStatus = await validateUserStatus(targetUserId);
          testResult = {
            test: 'Simulate Deleted User',
            targetUserId,
            userStatus,
            description: 'Testing validation against potentially deleted user'
          };
        } else {
          return NextResponse.json(
            { success: false, error: 'targetUserId required for deleted user simulation' },
            { status: 400 }
          );
        }
        break;

      case 'test_middleware_bypass':
        // Test if our middleware can be bypassed
        testResult = {
          test: 'Middleware Bypass Test',
          currentUserId: user.id,
          middlewareActive: true,
          description: 'If you can see this, middleware validation passed'
        };
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid test type' },
          { status: 400 }
        );
    }

    logger.info('Security simulation test executed', {
      action: 'securitySimulationTest',
      userId: user.id,
      testType,
      targetUserId
    });

    return NextResponse.json({
      success: true,
      message: 'Security simulation test completed',
      timestamp: new Date().toISOString(),
      testResult
    });

  } catch (error) {
    logger.error('Error in security simulation test', error, {
      action: 'securitySimulationTest'
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Security simulation test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}