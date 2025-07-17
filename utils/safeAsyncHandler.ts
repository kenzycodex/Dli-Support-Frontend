// utils/safeAsyncHandler.ts - Utility to prevent async operations from hanging

import { toast } from 'sonner';

export interface SafeAsyncOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  onTimeout?: () => void;
  onRetry?: (attempt: number) => void;
  showErrorToast?: boolean;
  showLoadingToast?: boolean;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
}

export class SafeAsyncError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'SafeAsyncError';
  }
}

export class TimeoutError extends SafeAsyncError {
  constructor(timeout: number) {
    super(`Operation timed out after ${timeout}ms`, 'TIMEOUT');
  }
}

export class RetryError extends SafeAsyncError {
  constructor(attempts: number, lastError: Error) {
    super(`Operation failed after ${attempts} attempts`, 'MAX_RETRIES', lastError);
  }
}

/**
 * Wraps an async function with timeout, retry logic, and error handling
 * Prevents the application from hanging due to failed async operations
 */
export async function safeAsyncHandler<T>(
  operation: () => Promise<T>,
  options: SafeAsyncOptions = {}
): Promise<T> {
  const {
    timeout = 15000, // 15 seconds default
    retries = 2,
    retryDelay = 1000,
    onError,
    onTimeout,
    onRetry,
    showErrorToast = true,
    showLoadingToast = false,
    loadingMessage = 'Processing...',
    successMessage,
    errorMessage,
  } = options;

  let loadingToastId: string | number | undefined;

  // Show loading toast if requested
  if (showLoadingToast) {
    loadingToastId = toast.loading(loadingMessage);
  }

  try {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(timeout));
      }, timeout);
    });

    // Attempt operation with retries
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`🎯 SafeAsync: Attempt ${attempt + 1}/${retries + 1}`);
        
        // Race between operation and timeout
        const result = await Promise.race([
          operation(),
          timeoutPromise
        ]);

        // Success - dismiss loading toast and show success message
        if (loadingToastId) {
          toast.dismiss(loadingToastId);
        }
        
        if (successMessage) {
          toast.success(successMessage);
        }

        console.log('✅ SafeAsync: Operation completed successfully');
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.error(`❌ SafeAsync: Attempt ${attempt + 1} failed:`, lastError);

        // Handle timeout specifically
        if (error instanceof TimeoutError) {
          if (onTimeout) {
            onTimeout();
          }
          
          if (attempt === retries) {
            throw error;
          }
          
          console.log(`⏱️ SafeAsync: Timeout on attempt ${attempt + 1}, retrying...`);
          
        } else if (attempt === retries) {
          // Max retries reached
          throw new RetryError(retries + 1, lastError);
        }

        // Retry logic
        if (attempt < retries) {
          if (onRetry) {
            onRetry(attempt + 1);
          }
          
          console.log(`🔄 SafeAsync: Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // This should never be reached, but just in case
    throw new RetryError(retries + 1, lastError || new Error('Unknown error'));

  } catch (error) {
    // Dismiss loading toast on error
    if (loadingToastId) {
      toast.dismiss(loadingToastId);
    }

    const finalError = error instanceof SafeAsyncError ? error : 
      new SafeAsyncError('Operation failed', 'UNKNOWN_ERROR', error instanceof Error ? error : new Error(String(error)));

    console.error('🚨 SafeAsync: Final error:', finalError);

    // Call custom error handler
    if (onError) {
      onError(finalError);
    }

    // Show error toast
    if (showErrorToast) {
      const message = errorMessage || 
        (finalError instanceof TimeoutError ? 'Operation timed out. Please try again.' : 
         finalError instanceof RetryError ? 'Operation failed after multiple attempts.' : 
         'An unexpected error occurred.');
      
      toast.error(message);
    }

    throw finalError;
  }
}

/**
 * Creates a safe async wrapper for a specific function
 * Useful for wrapping store actions or API calls
 */
export function createSafeAsyncWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  defaultOptions: SafeAsyncOptions = {}
): T {
  return ((...args: Parameters<T>) => {
    return safeAsyncHandler(
      () => fn(...args),
      defaultOptions
    );
  }) as T;
}

/**
 * Specialized wrapper for admin help operations
 */
export function safeAdminHelpHandler<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: Partial<SafeAsyncOptions> = {}
): Promise<T> {
  return safeAsyncHandler(operation, {
    timeout: 10000, // 10 seconds for admin operations
    retries: 1, // Only retry once for admin operations
    retryDelay: 500,
    showLoadingToast: true,
    loadingMessage: `${operationName}...`,
    onTimeout: () => {
      console.warn(`⏱️ AdminHelp: ${operationName} timed out`);
    },
    onRetry: (attempt) => {
      console.log(`🔄 AdminHelp: Retrying ${operationName} (attempt ${attempt})`);
    },
    onError: (error) => {
      console.error(`🚨 AdminHelp: ${operationName} failed:`, error);
    },
    ...options,
  });
}

/**
 * Utility to create a cancellable promise
 */
export function createCancellablePromise<T>(
  promise: Promise<T>
): { promise: Promise<T>; cancel: () => void } {
  let cancelled = false;
  
  const cancellablePromise = new Promise<T>((resolve, reject) => {
    promise
      .then(value => {
        if (!cancelled) {
          resolve(value);
        }
      })
      .catch(error => {
        if (!cancelled) {
          reject(error);
        }
      });
  });

  return {
    promise: cancellablePromise,
    cancel: () => {
      cancelled = true;
    }
  };
}

/**
 * Debounce function for preventing rapid successive calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

/**
 * Throttle function for limiting call frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}