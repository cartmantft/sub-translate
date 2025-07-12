import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { validateUserStatus } from '@/lib/utils/user-validation';
import { AdminUserManager, validateAdminPrivileges } from '@/lib/utils/admin-validation';

// POST method - Admin user management actions
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const { action, banDurationHours } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate admin user status
    const adminUserStatus = await validateUserStatus(user.id);
    if (!adminUserStatus.isValid) {
      logger.error('Security violation: Invalid admin attempted user management', {
        action: 'adminUserManagement',
        adminUserId: user.id,
        targetUserId,
        requestedAction: action,
        reason: adminUserStatus.reason,
        securityEvent: 'invalid_admin_access_blocked'
      });
      
      return NextResponse.json(
        { success: false, error: 'Admin account access denied', code: 'ADMIN_ACCOUNT_INVALID' },
        { status: 403 }
      );
    }

    // Validate admin privileges
    const adminCheck = await validateAdminPrivileges(user.id);
    if (!adminCheck.isAdmin) {
      logger.error('Security violation: Non-admin attempted user management', {
        action: 'adminUserManagement',
        adminUserId: user.id,
        targetUserId,
        requestedAction: action,
        reason: adminCheck.reason,
        securityEvent: 'unauthorized_admin_operation_attempt'
      });
      
      return NextResponse.json(
        { success: false, error: 'Admin privileges required', code: 'INSUFFICIENT_PRIVILEGES' },
        { status: 403 }
      );
    }

    // Validate target user exists
    const targetUserStatus = await validateUserStatus(targetUserId);
    if (!targetUserStatus.isValid && targetUserStatus.reason === 'not_found') {
      return NextResponse.json(
        { success: false, error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Prevent self-management for security
    if (user.id === targetUserId) {
      logger.warn('Admin attempted self-management', {
        action: 'adminUserManagement',
        adminUserId: user.id,
        requestedAction: action,
        securityEvent: 'admin_self_management_blocked'
      });
      
      return NextResponse.json(
        { success: false, error: 'Cannot perform actions on your own account', code: 'SELF_MANAGEMENT_FORBIDDEN' },
        { status: 400 }
      );
    }

    let result = false;
    let resultMessage = '';

    // Handle different admin actions
    switch (action) {
      case 'soft_delete':
        result = await AdminUserManager.softDeleteUser(targetUserId, user.id);
        resultMessage = result ? 'User soft deleted successfully' : 'Failed to soft delete user';
        break;

      case 'ban':
        if (!banDurationHours || banDurationHours <= 0) {
          return NextResponse.json(
            { success: false, error: 'Valid ban duration in hours is required' },
            { status: 400 }
          );
        }
        result = await AdminUserManager.banUser(targetUserId, user.id, banDurationHours);
        resultMessage = result ? `User banned for ${banDurationHours} hours` : 'Failed to ban user';
        break;

      case 'unban':
        result = await AdminUserManager.unbanUser(targetUserId, user.id);
        resultMessage = result ? 'User unbanned successfully' : 'Failed to unban user';
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Supported actions: soft_delete, ban, unban' },
          { status: 400 }
        );
    }

    if (result) {
      return NextResponse.json({
        success: true,
        message: resultMessage,
        action,
        targetUserId,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { success: false, error: resultMessage },
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error('Error in admin user management API', error, {
      action: 'adminUserManagement',
      targetUserId: 'unknown'
    });
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}

// GET method - Get user status information (for admin)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate admin user status
    const adminUserStatus = await validateUserStatus(user.id);
    if (!adminUserStatus.isValid) {
      return NextResponse.json(
        { success: false, error: 'Admin account access denied', code: 'ADMIN_ACCOUNT_INVALID' },
        { status: 403 }
      );
    }

    // Validate admin privileges
    const adminCheck = await validateAdminPrivileges(user.id);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin privileges required', code: 'INSUFFICIENT_PRIVILEGES' },
        { status: 403 }
      );
    }

    // Get target user information
    const { data: targetUser, error } = await supabase
      .from('auth.users')
      .select('id, email, created_at, last_sign_in_at, deleted_at, banned_until')
      .eq('id', targetUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      
      logger.error('Error fetching user information', error, {
        action: 'getAdminUserInfo',
        adminUserId: user.id,
        targetUserId
      });
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user information' },
        { status: 500 }
      );
    }

    // Determine user status
    let status = 'active';
    if (targetUser.deleted_at) {
      status = 'deleted';
    } else if (targetUser.banned_until && new Date(targetUser.banned_until) > new Date()) {
      status = 'banned';
    }

    return NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        status,
        created_at: targetUser.created_at,
        last_sign_in_at: targetUser.last_sign_in_at,
        deleted_at: targetUser.deleted_at,
        banned_until: targetUser.banned_until
      }
    });

  } catch (error) {
    logger.error('Error in admin user info API', error, {
      action: 'getAdminUserInfo'
    });
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}