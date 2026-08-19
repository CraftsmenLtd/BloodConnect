import type { ReactNode } from 'react'
import React, { createContext, useState, useEffect, useCallback } from 'react'
import { useColorScheme } from 'react-native'
import * as SystemUI from 'expo-system-ui'
import type { Theme, ThemeMode } from '..'
import { lightTheme, darkTheme } from '..'
import { THEME_NAME, THEME_MODE, THEME_MODE_STORAGE_KEY } from '../../constant/theme'
import storageService from '../../../utility/storageService'

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

type ThemeProviderProps = {
  children: ReactNode;
}

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === THEME_MODE.SYSTEM || value === THEME_MODE.LIGHT || value === THEME_MODE.DARK

const isDarkMode = (mode: ThemeMode, systemTheme: string | null | undefined): boolean =>
  mode === THEME_MODE.SYSTEM ? systemTheme === THEME_NAME.DARK : mode === THEME_MODE.DARK

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemTheme = useColorScheme()
  const [mode, setModeState] = useState<ThemeMode>(THEME_MODE.SYSTEM)

  useEffect(() => {
    void (async() => {
      try {
        const stored = await storageService.getItem<string>(THEME_MODE_STORAGE_KEY)
        if (isThemeMode(stored)) {
          setModeState(stored)
        }
      } catch {
        // fall back to system default
      }
    })()
  }, [])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    void storageService.storeItem(THEME_MODE_STORAGE_KEY, next).catch(() => undefined)
  }, [])

  const isDark = isDarkMode(mode, systemTheme)
  const theme = isDark ? darkTheme : lightTheme

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.colors.background)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, mode, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}
