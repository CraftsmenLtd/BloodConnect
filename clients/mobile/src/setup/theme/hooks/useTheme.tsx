import { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'
import type { Theme, ThemeMode } from '../index'

const useThemeContext = () => {
  const context = useContext(ThemeContext)
  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}

export const useTheme = (): Theme => useThemeContext().theme

export const useIsDark = (): boolean => useThemeContext().isDark

export const useThemeMode = (): { mode: ThemeMode; setMode: (mode: ThemeMode) => void } => {
  const { mode, setMode } = useThemeContext()

  return { mode, setMode }
}
