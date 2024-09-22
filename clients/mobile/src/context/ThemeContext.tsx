import React, { createContext, useState, useEffect, ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { lightTheme, darkTheme, Theme } from '../theme'

export const ThemeContext = createContext<Theme | null>(null)

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemTheme = useColorScheme()
  const [theme, setTheme] = useState<Theme>(systemTheme === 'dark' ? darkTheme : lightTheme)

  useEffect(() => {
    setTheme(systemTheme === 'dark' ? darkTheme : lightTheme)
  }, [systemTheme])

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}
