import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  // During build time, return a minimal dummy client if env vars are missing
  if (!url || !anonKey) {
    if (typeof window === 'undefined') {
      return {} as any; // Safe for server-side prerendering
    }
  }

  return createBrowserClient(
    url || 'https://placeholder.supabase.co',
    anonKey || 'placeholder'
  )
}
