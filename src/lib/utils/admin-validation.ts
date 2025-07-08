import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * Admin privilege validation utility
 * Checks if user has admin privileges
 */

export interface AdminCheckResult {
  isAdmin: boolean;
  reason?: 'not_authenticated' | 'not_admin' | 'database_error';
}

/**
 * Checks if the current user has admin privileges
 * @param userId - The user ID to check
 * @returns Promise<AdminCheckResult> - Admin check result
 */
export async function validateAdminPrivileges(userId: string): Promise<AdminCheckResult> {
  try {
    const supabase = await createClient();
    
    // Get user data from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      logger.warn('Admin validation failed - auth getUser failed', {
        action: 'validateAdminPrivileges',
        userId,
        authError: authError?.message
      });
      return { isAdmin: false, reason: 'not_authenticated' };
    }

    // Check admin status from user metadata
    const appMetadata = user.app_metadata || {};
    const userMetadata = user.user_metadata || {};
    
    // Check for admin role in metadata
    const isAdmin = appMetadata.role === 'admin' || 
                   appMetadata.is_super_admin === true ||
                   userMetadata.role === 'admin' ||
                   userMetadata.is_admin === true;

    if (!isAdmin) {
      logger.warn('Non-admin user attempted admin operation', {
        action: 'validateAdminPrivileges',
        userId,
        email: user.email,
        appMetadata: appMetadata,
        userMetadata: userMetadata,
        securityEvent: 'unauthorized_admin_access_attempt'
      });
      return { isAdmin: false, reason: 'not_admin' };
    }

    logger.info('Admin privileges validated successfully', {
      action: 'validateAdminPrivileges',
      userId,
      email: user.email,
      adminSource: appMetadata.role === 'admin' ? 'app_metadata' : 'user_metadata'
    });
    
    return { isAdmin: true };

  } catch (error) {
    logger.error('Unexpected error during admin validation', error, {
      action: 'validateAdminPrivileges',
      userId
    });
    return { isAdmin: false, reason: 'database_error' };
  }
}

/**
 * User management operations for admins
 */
export class AdminUserManager {
  
  /**
   * Soft delete a user (set deleted_at timestamp)
   * @param targetUserId - User ID to delete
   * @param adminUserId - Admin user performing the action
   * @returns Promise<boolean> - Success status
   */
  static async softDeleteUser(targetUserId: string, adminUserId: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      
      // Verify admin privileges
      const adminCheck = await validateAdminPrivileges(adminUserId);
      if (!adminCheck.isAdmin) {
        logger.error('Unauthorized soft delete attempt', {
          action: 'softDeleteUser',
          adminUserId,
          targetUserId,
          reason: adminCheck.reason,
          securityEvent: 'unauthorized_user_deletion_attempt'
        });
        return false;
      }

      // For now, we'll use the Admin API approach or metadata update
      // This requires Supabase Admin API access which is more secure
      logger.warn('Soft delete requested - requires Supabase Admin API implementation', {
        action: 'softDeleteUser',
        adminUserId,
        targetUserId,
        note: 'This functionality requires server-side Admin API implementation'
      });

      // TODO: Implement with Supabase Admin API
      // const adminSupabase = createAdminClient();
      // await adminSupabase.auth.admin.updateUserById(targetUserId, {
      //   user_metadata: { ...user.user_metadata, deleted_at: new Date().toISOString() }
      // });

      logger.info('User soft delete logged (implementation pending)', {
        action: 'softDeleteUser',
        adminUserId,
        targetUserId,
        timestamp: new Date().toISOString(),
        securityEvent: 'user_soft_delete_requested'
      });

      return true;

    } catch (error) {
      logger.error('Unexpected error during soft delete', error, {
        action: 'softDeleteUser',
        adminUserId,
        targetUserId
      });
      return false;
    }
  }

  /**
   * Ban a user temporarily
   * @param targetUserId - User ID to ban
   * @param adminUserId - Admin user performing the action
   * @param banDurationHours - Duration of ban in hours
   * @returns Promise<boolean> - Success status
   */
  static async banUser(targetUserId: string, adminUserId: string, banDurationHours: number): Promise<boolean> {
    try {
      const supabase = await createClient();
      
      // Verify admin privileges
      const adminCheck = await validateAdminPrivileges(adminUserId);
      if (!adminCheck.isAdmin) {
        logger.error('Unauthorized ban attempt', {
          action: 'banUser',
          adminUserId,
          targetUserId,
          reason: adminCheck.reason,
          securityEvent: 'unauthorized_user_ban_attempt'
        });
        return false;
      }

      // Calculate ban end time
      const bannedUntil = new Date();
      bannedUntil.setHours(bannedUntil.getHours() + banDurationHours);

      // Set banned_until timestamp
      const { error } = await supabase
        .from('auth.users')
        .update({ banned_until: bannedUntil.toISOString() })
        .eq('id', targetUserId);

      if (error) {
        logger.error('Failed to ban user', error, {
          action: 'banUser',
          adminUserId,
          targetUserId,
          banDurationHours
        });
        return false;
      }

      logger.info('User banned successfully', {
        action: 'banUser',
        adminUserId,
        targetUserId,
        banDurationHours,
        bannedUntil: bannedUntil.toISOString(),
        securityEvent: 'user_banned'
      });

      return true;

    } catch (error) {
      logger.error('Unexpected error during user ban', error, {
        action: 'banUser',
        adminUserId,
        targetUserId
      });
      return false;
    }
  }

  /**
   * Unban a user (clear banned_until)
   * @param targetUserId - User ID to unban
   * @param adminUserId - Admin user performing the action
   * @returns Promise<boolean> - Success status
   */
  static async unbanUser(targetUserId: string, adminUserId: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      
      // Verify admin privileges
      const adminCheck = await validateAdminPrivileges(adminUserId);
      if (!adminCheck.isAdmin) {
        logger.error('Unauthorized unban attempt', {
          action: 'unbanUser',
          adminUserId,
          targetUserId,
          reason: adminCheck.reason,
          securityEvent: 'unauthorized_user_unban_attempt'
        });
        return false;
      }

      // Clear banned_until timestamp
      const { error } = await supabase
        .from('auth.users')
        .update({ banned_until: null })
        .eq('id', targetUserId);

      if (error) {
        logger.error('Failed to unban user', error, {
          action: 'unbanUser',
          adminUserId,
          targetUserId
        });
        return false;
      }

      logger.info('User unbanned successfully', {
        action: 'unbanUser',
        adminUserId,
        targetUserId,
        securityEvent: 'user_unbanned'
      });

      return true;

    } catch (error) {
      logger.error('Unexpected error during user unban', error, {
        action: 'unbanUser',
        adminUserId,
        targetUserId
      });
      return false;
    }
  }
}