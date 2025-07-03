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
      console.warn('[Security] Rejected non-HTTPS redirect attempt:', redirectUrl);
      return fallbackUrl;
    }

    // Ensure same-origin redirect
    if (parsedUrl.origin !== currentOrigin) {
      console.warn('[Security] Rejected cross-origin redirect attempt:', {
        attempted: parsedUrl.origin,
        current: currentOrigin,
        redirectUrl
      });
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
      console.warn('[Security] Rejected redirect to disallowed path:', {
        path: parsedUrl.pathname,
        allowedPaths: config.allowedPaths,
        redirectUrl
      });
      return fallbackUrl;
    }

    // Return the validated path (without query params and fragments for security)
    return parsedUrl.pathname;

  } catch (error) {
    // Handle malformed URLs
    console.warn('[Security] Rejected malformed URL redirect attempt:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      redirectUrl
    });
    return fallbackUrl;
  }
}

/**
 * Creates a safe redirect URL by combining origin with validated path
 * 
 * @param redirectPath - The path to redirect to
 * @param origin - The current origin
 * @returns Complete validated redirect URL
 */
export function createSafeRedirectUrl(redirectPath: string, origin: string): string {
  const safePath = validateRedirectUrl(redirectPath, origin);
  return `${origin}${safePath}`;
}

/**
 * Validates if a URL is in the allowed origins list
 * 
 * @param url - The URL to check
 * @returns true if the URL origin is allowed
 */
export function isAllowedOrigin(url: string): boolean {
  const config = getRedirectConfig();
  
  try {
    const parsedUrl = new URL(url);
    return config.allowedOrigins.includes(parsedUrl.origin);
  } catch {
    return false;
  }
}

/**
 * Sanitizes a redirect URL by removing potentially dangerous components
 * 
 * @param redirectUrl - The URL to sanitize
 * @param currentOrigin - The current request origin
 * @returns Sanitized URL
 */
export function sanitizeRedirectUrl(redirectUrl: string, currentOrigin: string): string {
  const validatedPath = validateRedirectUrl(redirectUrl, currentOrigin);
  
  // Additional sanitization - ensure no javascript: or data: schemes
  if (validatedPath.toLowerCase().includes('javascript:') || 
      validatedPath.toLowerCase().includes('data:') ||
      validatedPath.toLowerCase().includes('vbscript:')) {
    console.warn('[Security] Rejected redirect with dangerous scheme:', redirectUrl);
    return '/';
  }

  return validatedPath;
}

/**
 * Logs security events for monitoring and analysis
 * 
 * @param eventType - Type of security event
 * @param details - Event details
 */
export function logSecurityEvent(eventType: string, details: Record<string, any>): void {
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
  context: { userAgent?: string; ip?: string; route?: string } = {}
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