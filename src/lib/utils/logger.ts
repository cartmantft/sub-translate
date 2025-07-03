/**
 * Environment-aware logger utility
 * - In development: logs full error details for debugging
 * - In production: masks sensitive information to prevent data leaks
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  action?: string;
  component?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  /**
   * Masks sensitive information in error messages
   */
  private maskSensitiveData(message: string): string {
    // Mask API keys
    let masked = message.replace(/([A-Za-z0-9_-]{20,})/g, (match) => {
      if (match.length > 30) {
        return match.substring(0, 6) + '...' + match.substring(match.length - 4);
      }
      return match;
    });
    
    // Mask email addresses
    masked = masked.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, (match, localPart, domain) => {
      return localPart.substring(0, 2) + '***@' + domain;
    });
    
    // Mask URLs with sensitive query parameters
    masked = masked.replace(/(\?|&)(key|token|password|secret|api_key)=([^&\s]+)/gi, '$1$2=***');
    
    // Mask file paths that might contain user info
    masked = masked.replace(/\/users\/[^\/]+/g, '/users/***');
    masked = masked.replace(/\/home\/[^\/]+/g, '/home/***');
    
    return masked;
  }

  /**
   * Formats the log message with timestamp and level
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}]${contextStr} ${message}`;
  }

  /**
   * Main logging method
   */
  private log(level: LogLevel, message: string, error?: Error | unknown, context?: LogContext) {
    const formattedMessage = this.formatMessage(level, message, context);
    
    if (this.isDevelopment) {
      // In development, log everything
      switch (level) {
        case 'debug':
          console.log(formattedMessage);
          break;
        case 'info':
          console.info(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          if (error) console.warn('Error details:', error);
          break;
        case 'error':
          console.error(formattedMessage);
          if (error) console.error('Error details:', error);
          break;
      }
    } else {
      // In production, mask sensitive data and only log warnings and errors
      if (level === 'warn' || level === 'error') {
        const maskedMessage = this.maskSensitiveData(formattedMessage);
        
        if (level === 'warn') {
          console.warn(maskedMessage);
        } else {
          console.error(maskedMessage);
          
          // For errors, log a sanitized stack trace
          if (error instanceof Error) {
            const maskedStack = this.maskSensitiveData(error.stack || '');
            console.error('Error stack:', maskedStack.split('\n').slice(0, 5).join('\n'));
          }
        }
      }
    }
  }

  /**
   * Debug level - only logs in development
   */
  debug(message: string, context?: LogContext) {
    this.log('debug', message, undefined, context);
  }

  /**
   * Info level - only logs in development
   */
  info(message: string, context?: LogContext) {
    this.log('info', message, undefined, context);
  }

  /**
   * Warning level - logs in both environments
   */
  warn(message: string, error?: Error | unknown, context?: LogContext) {
    this.log('warn', message, error, context);
  }

  /**
   * Error level - logs in both environments
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    this.log('error', message, error, context);
  }

  /**
   * Utility method to safely stringify objects
   */
  safeStringify(obj: any): string {
    try {
      return JSON.stringify(obj, (key, value) => {
        // Mask sensitive keys
        if (['password', 'secret', 'token', 'key', 'api_key', 'apiKey'].includes(key)) {
          return '***';
        }
        return value;
      });
    } catch (error) {
      return '[Unable to stringify object]';
    }
  }
}

// Export a singleton instance
export const logger = new Logger();

// Export types for use in other files
export type { LogLevel, LogContext };