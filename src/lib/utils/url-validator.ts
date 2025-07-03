/**
 * URL Validation Utility for Open Redirect Prevention
 * 
 * This module provides secure URL validation to prevent Open Redirect attacks.
 * All redirect URLs are validated against an allowlist of permitted domains and paths.
 * 
 * Security Features:
 * - Same-origin enforcement
 * - Path allowlist validation  
 * - Malformed URL handling
 * - Protocol enforcement (HTTPS in production)
 * - Fragment and query parameter sanitization
 */

/**
 * Configuration for allowed redirect destinations
 */
interface RedirectConfig {
  allowedDomains: string[];
  allowedPaths: string[];
  allowedOrigins: string[];
  enforceHttps: boolean;
}

/**
 * Get redirect validation configuration based on environment
 */
function getRedirectConfig(): RedirectConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Base allowed paths for the application
  const allowedPaths = [
    '/',
    '/dashboard',
    '/projects',
    '/login',
    '/auth/callback',
    '/auth/auth-code-error'
  ];

  if (isDevelopment) {
    return {
      allowedDomains: ['localhost', '127.0.0.1'],
      allowedPaths,
      allowedOrigins: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001', // Test server
        'http://127.0.0.1:3001'
      ],
      enforceHttps: false
    };
  }

  // Production configuration
  return {
    allowedDomains: [
      'sub-translate.vercel.app',
      // Add your production domain here
    ],
    allowedPaths,
    allowedOrigins: [
      'https://sub-translate.vercel.app',
      // Add your production URLs here
    ],
    enforceHttps: true
  };
}

/**
 * Validates if a redirect URL is safe and allowed
 * 
 * @param redirectUrl - The URL to validate
 * @param currentOrigin - The current request origin
 * @returns The validated safe URL or fallback URL if invalid
 */
export function validateRedirectUrl(redirectUrl: string, currentOrigin: string): string {
  const config = getRedirectConfig();
  const fallbackUrl = '/';

  // Handle empty or null URLs
  if (!redirectUrl || redirectUrl.trim() === '') {
    return fallbackUrl;
  }

  try {
    let parsedUrl: URL;

    // Handle relative URLs
    if (redirectUrl.startsWith('/')) {
      parsedUrl = new URL(redirectUrl, currentOrigin);
    } else {
      parsedUrl = new URL(redirectUrl);
    }

    // Enforce HTTPS in production
    if (config.enforceHttps && parsedUrl.protocol !== 'https:') {
      return fallbackUrl;
    }

    // Ensure the current origin is in the allowlist AND the redirect target has the same origin.
    if (!config.allowedOrigins.includes(currentOrigin) || parsedUrl.origin !== currentOrigin) {
      return fallbackUrl;
    }

    // Validate path against allowlist
    const normalizedPath = parsedUrl.pathname.toLowerCase();
    const isPathAllowed = config.allowedPaths.some(allowedPath => {
      const normalizedAllowedPath = allowedPath.toLowerCase();
      return normalizedPath === normalizedAllowedPath || 
             (normalizedPath.startsWith(normalizedAllowedPath + '/') && allowedPath !== '/');
    });

    if (!isPathAllowed) {
      return fallbackUrl;
    }

    // Return the validated path (without query params and fragments for security)
    return parsedUrl.pathname;

  } catch {
    // Handle malformed URLs
    return fallbackUrl;
  }
}


/**
 * Logs security events for monitoring and analysis
 * 
 * @param eventType - Type of security event
 * @param details - Event details
 */
export function logSecurityEvent(eventType: string, details: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type: 'SECURITY_EVENT',
    event: eventType,
    ...details
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Security Event]', logEntry);
  }

  // In production, this could be sent to a security monitoring service
  // Example: sendToSecurityService(logEntry);
}

/**
 * Comprehensive redirect validation with security logging
 * 
 * @param redirectUrl - The URL to validate
 * @param currentOrigin - The current request origin
 * @param context - Context information for logging
 * @returns Validated redirect URL or fallback
 */
export function validateRedirectWithLogging(
  redirectUrl: string, 
  currentOrigin: string,
  context: { userAgent?: string; ip?: string; route?: string; [key: string]: unknown } = {}
): string {
  const originalUrl = redirectUrl;
  const validatedUrl = validateRedirectUrl(redirectUrl, currentOrigin);
  
  // Log security event if URL was changed (indicating potential attack)
  if (validatedUrl !== originalUrl && validatedUrl === '/') {
    logSecurityEvent('REDIRECT_BLOCKED', {
      originalUrl,
      validatedUrl,
      currentOrigin,
      ...context
    });
  }

  return validatedUrl;
}