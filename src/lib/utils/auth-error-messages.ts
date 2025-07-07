/**
 * Centralized authentication error message utility
 * Handles both URL parameter errors and API response errors
 */

interface ErrorData {
  error?: string;
  error_description?: string;
  error_code?: string;
  message?: string;
}

/**
 * Generate user-friendly error message for OAuth and authentication errors
 */
export function getAuthErrorMessage(
  error?: string | null,
  errorDescription?: string | null,
  errorData?: ErrorData
): string {
  // Handle OAuth provider configuration errors consistently
  const isOAuthProviderError = (desc?: string | null, data?: ErrorData) => {
    if (!desc && !data) return false;
    
    return (
      desc?.includes('provider is not enabled') ||
      desc?.includes('Unsupported provider') ||
      data?.error_code === 'validation_failed' ||
      data?.message?.includes('provider is not enabled') ||
      data?.message?.includes('Unsupported provider')
    );
  };

  // Primary error handling based on error code
  if (error) {
    switch (error) {
      case 'invalid_credentials':
      case 'invalid_grant':
        return '이메일 또는 비밀번호가 올바르지 않습니다.';
      
      case 'email_not_confirmed':
        return '이메일 인증이 필요합니다. 이메일을 확인해주세요.';
      
      case 'too_many_requests':
        return '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
      
      case 'signup_disabled':
        return '현재 회원가입이 비활성화되어 있습니다.';
      
      case 'access_denied':
        return '로그인이 취소되었습니다.';
      
      case 'validation_failed':
        if (isOAuthProviderError(errorDescription, errorData)) {
          return '🔧 소셜 로그인 서비스가 설정되지 않았습니다. 관리자에게 문의해주세요.';
        } else {
          return '로그인 설정에 문제가 있습니다. 관리자에게 문의해주세요.';
        }
      
      case 'unsupported_provider':
        return '🔧 지원되지 않는 로그인 방법입니다. 다른 방법으로 시도해주세요.';
      
      case 'provider_not_found':
        return '🔧 소셜 로그인 서비스를 찾을 수 없습니다. 관리자에게 문의해주세요.';
      
      default:
        // Fall through to description-based handling
        break;
    }
  }

  // Secondary error handling based on error description or data
  if (errorDescription || errorData) {
    if (isOAuthProviderError(errorDescription, errorData)) {
      return '🔧 소셜 로그인 서비스가 아직 설정되지 않았습니다. 이메일 로그인을 사용하거나 관리자에게 문의해주세요.';
    }
    
    // Handle specific error text patterns
    const errorText = errorDescription || errorData?.message || '';
    
    if (errorText.includes('Invalid login credentials') || 
        errorText.includes('invalid_grant')) {
      return '🚫 이메일 또는 비밀번호가 올바르지 않습니다.';
    }
    
    if (errorText.includes('Email not confirmed')) {
      return '📧 이메일 인증이 필요합니다. 이메일을 확인해주세요.';
    }
    
    if (errorText.includes('too many requests')) {
      return '⏰ 너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
    }
    
    // In development, show the actual error description if available
    if (process.env.NODE_ENV === 'development' && errorDescription) {
      return errorDescription;
    }
  }

  // Default fallback message
  return '로그인 중 오류가 발생했습니다. 다시 시도해주세요.';
}

/**
 * Handle API response error specifically for fetch monitoring
 */
export function getApiErrorMessage(
  status: number,
  errorData: ErrorData
): string {
  if (status === 400) {
    const errorText = errorData.error_description || errorData.message || '';
    
    if (errorText.includes('Invalid login credentials') || 
        errorText.includes('invalid_grant')) {
      return '🚫 이메일 또는 비밀번호가 올바르지 않습니다.';
    }
    
    if (errorText.includes('Email not confirmed')) {
      return '📧 이메일 인증이 필요합니다. 이메일을 확인해주세요.';
    }
    
    if (errorText.includes('too many requests')) {
      return '⏰ 너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
    }
    
    if (errorText.includes('provider is not enabled') || 
        errorText.includes('Unsupported provider') ||
        errorData.error_code === 'validation_failed') {
      return '🔧 소셜 로그인 서비스가 아직 설정되지 않았습니다. 이메일 로그인을 사용하거나 관리자에게 문의해주세요.';
    }
    
    return '❌ 로그인 정보를 확인해주세요.';
  }
  
  return '로그인 중 오류가 발생했습니다.';
}