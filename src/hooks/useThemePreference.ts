import { useEffect, useState } from 'react'
import {
  applyThemePreference,
  applyTenantThemePreference,
  getTenantThemePreference,
  getThemePreference,
  saveThemePreference,
  type ThemePreference,
} from '@/services/preferences'

export function useThemePreference() {
  const [theme, setThemeState] = useState<ThemePreference>(() => getThemePreference())

  useEffect(() => {
    applyThemePreference(theme)
    applyTenantThemePreference(getTenantThemePreference())
    if (theme !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      applyThemePreference('system')
      applyTenantThemePreference(getTenantThemePreference())
    }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [theme])

  function setTheme(nextTheme: ThemePreference) {
    setThemeState(nextTheme)
    saveThemePreference(nextTheme)
  }

  return { theme, setTheme }
}
