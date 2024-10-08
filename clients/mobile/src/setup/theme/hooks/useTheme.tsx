import { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'
import { Theme } from '../index'

export const useTheme = (): Theme => {
  const context = useContext(ThemeContext)
  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
