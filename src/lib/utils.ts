import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { StoreApi, UseBoundStore } from 'zustand'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function randomColor() {
  const digits = '0123456789abcdef'
  let code = '#'
  for (let i = 0; i < 6; i++) {
    code += digits.charAt(Math.floor(Math.random() * 16))
  }
  return code
}

export function errorMessage(error: any) {
  return error instanceof Error ? error.message : `${error}`
}

/**
 * Creates a throttled function that limits how often the original function can be called
 * @param fn The function to throttle
 * @param delay The delay in milliseconds
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now()
    const remaining = delay - (now - lastCall)

    if (remaining <= 0) {
      // If enough time has passed, execute the function immediately
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      lastCall = now
      fn.apply(this, args)
    } else if (!timeoutId) {
      // If not enough time has passed, set a timeout to execute after the remaining time
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        timeoutId = null
        fn.apply(this, args)
      }, remaining)
    }
  }
}

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never

export const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(_store: S) => {
  const store = _store as WithSelectors<typeof _store>
  store.use = {}
  for (const k of Object.keys(store.getState())) {
    ;(store.use as any)[k] = () => store((s) => s[k as keyof typeof s])
  }

  return store
}

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @returns Promise that resolves with the function result
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Don't retry on authentication errors
      if (error && typeof error === 'object' && 'code' in error) {
        const errCode = (error as { code: string }).code;
        if (errCode === 'permission-denied' ||
            errCode === 'unauthenticated' ||
            errCode === 'invalid-argument') {
          throw lastError;
        }
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      
      // Add some jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * delay;
      const totalDelay = delay + jitter;
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries + 1} in ${totalDelay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  throw lastError!;
};

/**
 * Check if an error is retryable
 * @param error - Error to check
 * @returns True if the error is retryable
 */
export const isRetryableError = (error: any): boolean => {
  if (!error) return false;
  
  // Network errors are retryable
  if (error.code === 'unavailable' || 
      error.message?.includes('network') || 
      error.message?.includes('connection') ||
      error.message?.includes('timeout')) {
    return true;
  }
  
  // Server errors (5xx) are retryable
  if (error.code === 'internal' || 
      error.code === 'resource-exhausted' ||
      error.code === 'deadline-exceeded') {
    return true;
  }
  
  return false;
};
