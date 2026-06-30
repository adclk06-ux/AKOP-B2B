export type ThemePreference = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'akop.theme'
const TENANT_THEME_STORAGE_KEY = 'akop.tenantTheme'

export interface TenantThemePreference {
  primary: string
  accent: string
  accentSoft: string
}

const DEFAULT_TENANT_THEME: TenantThemePreference = {
  primary: '216 86% 56%',
  accent: '158 79% 52%',
  accentSoft: '158 58% 14%',
}

function getSystemTheme() {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveTheme(preference: ThemePreference) {
  return preference === 'system' ? getSystemTheme() : preference
}

export function getThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'dark'
}

export function applyThemePreference(preference: ThemePreference) {
  if (typeof document === 'undefined') return
  const resolved = resolveTheme(preference)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  document.documentElement.dataset.theme = resolved
}

export function saveThemePreference(preference: ThemePreference) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  }
  applyThemePreference(preference)
}

export function getTenantThemePreference(): TenantThemePreference {
  if (typeof window === 'undefined') return DEFAULT_TENANT_THEME
  try {
    const raw = window.localStorage.getItem(TENANT_THEME_STORAGE_KEY)
    if (!raw) return DEFAULT_TENANT_THEME
    const parsed = JSON.parse(raw) as TenantThemePreference
    return {
      primary: parsed.primary || DEFAULT_TENANT_THEME.primary,
      accent: parsed.accent || DEFAULT_TENANT_THEME.accent,
      accentSoft: parsed.accentSoft || DEFAULT_TENANT_THEME.accentSoft,
    }
  } catch {
    return DEFAULT_TENANT_THEME
  }
}

export function applyTenantThemePreference(preference: TenantThemePreference) {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--akop-tenant-primary', preference.primary)
  document.documentElement.style.setProperty('--akop-tenant-accent', preference.accent)
  document.documentElement.style.setProperty('--akop-tenant-accent-soft', preference.accentSoft)
}

export function saveTenantThemePreference(preference: TenantThemePreference) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TENANT_THEME_STORAGE_KEY, JSON.stringify(preference))
  }
  applyTenantThemePreference(preference)
}
