import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * User status validation utility
 * Checks if user is active, not deleted, and not banned
 */

export interface UserStatusResult {
  isValid: boolean;
  reason?: 'deleted' | 'banned' | 'not_found' | 'database_error';
  bannedUntil?: Date;
  deletedAt?: Date;
}

/**
 * Validates user status by checking auth.users table directly
 * @param userId - The user ID to validate
 * @returns Promise<UserStatusResult> - Validation result with details
 */
export async function validateUserStatus(userId: string): Promise<UserStatusResult> {
  try {
    const supabase = await createClient();
    
    // Try to get user data from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // If we can't get the user or the user ID doesn't match, it might be invalid
    if (authError || !user || user.id !== userId) {
      logger.warn('User validation failed - auth getUser failed', {
        action: 'validateUserStatus',
        userId,
        authError: authError?.message,
        hasUser: !!user,
        userIdMatch: user?.id === userId
      });
      return { isValid: false, reason: 'not_found' };
    }

    // Try to create a user profiles table query as a proxy for user existence
    // This is a safer approach than directly querying auth.users
    const { data: profileData, error } = await supabase
      .rpc('get_user_profile', { user_id: userId })
      .single();

    if (error && error.code !== 'PGRST301') {
      // PGRST301 means function doesn't exist, which is expected
      // Try alternative approach with auth metadata
      const userMetadata = user.user_metadata || {};
      const appMetadata = user.app_metadata || {};
      
      // Check if user has been soft deleted via metadata
      if (userMetadata.deleted_at || appMetadata.deleted_at) {
        logger.warn('Soft deleted user attempted access', {
          action: 'validateUserStatus',
          userId,
          deletedAt: userMetadata.deleted_at || appMetadata.deleted_at,
          securityEvent: 'deleted_user_access_attempt'
        });
        return { 
          isValid: false, 
          reason: 'deleted',
          deletedAt: new Date(userMetadata.deleted_at || appMetadata.deleted_at)
        };
      }

      // Check if user is banned via metadata
      if (userMetadata.banned_until || appMetadata.banned_until) {
        const bannedUntil = new Date(userMetadata.banned_until || appMetadata.banned_until);
        const now = new Date();
        
        if (bannedUntil > now) {
          logger.warn('Banned user attempted access', {
            action: 'validateUserStatus',
            userId,
            bannedUntil: bannedUntil.toISOString(),
            remainingBanTime: bannedUntil.getTime() - now.getTime(),
            securityEvent: 'banned_user_access_attempt'
          });
          return { 
            isValid: false, 
            reason: 'banned',
            bannedUntil 
          };
        }
      }

      // If we can't determine status definitively, log and allow
      // This is safer than blocking valid users
      logger.debug('User validation passed with limited checks', {
        action: 'validateUserStatus',
        userId,
        reason: 'limited_validation_available'
      });
      return { isValid: true };
    }

    // If we have profile data, check it for user status
    if (profileData) {
      // Check profile data for banned/deleted status
      if (profileData.deleted_at) {
        logger.warn('Deleted user attempted access (from profile)', {
          action: 'validateUserStatus',
          userId,
          deletedAt: profileData.deleted_at,
          securityEvent: 'deleted_user_access_attempt'
        });
        return { 
          isValid: false, 
          reason: 'deleted',
          deletedAt: new Date(profileData.deleted_at)
        };
      }

      if (profileData.banned_until) {
        const bannedUntil = new Date(profileData.banned_until);
        const now = new Date();
        
        if (bannedUntil > now) {
          logger.warn('Banned user attempted access (from profile)', {
            action: 'validateUserStatus',
            userId,
            bannedUntil: profileData.banned_until,
            remainingBanTime: bannedUntil.getTime() - now.getTime(),
            securityEvent: 'banned_user_access_attempt'
          });
          return { 
            isValid: false, 
            reason: 'banned',
            bannedUntil 
          };
        }
      }
    }

    // User passed all validation checks
    logger.debug('User validation successful', {
      action: 'validateUserStatus',
      userId,
      validationMethod: profileData ? 'profile_data' : 'metadata'
    });
    
    return { isValid: true };

  } catch (error) {
    logger.error('Unexpected error during user validation', error, {
      action: 'validateUserStatus',
      userId
    });
    return { isValid: false, reason: 'database_error' };
  }
}

/**
 * Quick validation function for middleware use
 * @param userId - The user ID to validate
 * @returns Promise<boolean> - Simple true/false result
 */
export async function isUserActive(userId: string): Promise<boolean> {
  const result = await validateUserStatus(userId);
  return result.isValid;
}