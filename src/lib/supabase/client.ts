import { createBrowserClient } from '@supabase/ssr'

// 개발 환경에서만 사용할 메모리 스토리지
const memoryStorage = {
  storage: {} as Record<string, string>,
  getItem: (key: string) => memoryStorage.storage[key] || null,
  setItem: (key: string, value: string) => { memoryStorage.storage[key] = value },
  removeItem: (key: string) => { delete memoryStorage.storage[key] },
};

export function createClient() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key) {
          if (typeof window === 'undefined') return null
          const cookie = document.cookie.split('; ').find(row => row.startsWith(`${key}=`))
          return cookie ? decodeURIComponent(cookie.split('=')[1]) : null
        },
        set(key, value, options) {
          if (typeof window === 'undefined') return
          document.cookie = `${key}=${encodeURIComponent(value)}; path=/; ${options?.maxAge ? `max-age=${options.maxAge};` : ''} ${options?.httpOnly ? 'httponly;' : ''} ${options?.secure ? 'secure;' : ''} ${options?.sameSite ? `samesite=${options.sameSite}` : ''}`
        },
        remove(key) {
          if (typeof window === 'undefined') return
          document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        },
      },
      auth: {
        detectSessionInUrl: true, // OAuth 콜백 URL 세션 감지 활성화
        persistSession: !isDevelopment, // 개발 환경에서는 세션 지속 비활성화
        autoRefreshToken: true,
        storage: isDevelopment ? memoryStorage : undefined, // 개발 환경에서는 메모리 스토리지 사용
      },
    }
  )
}
