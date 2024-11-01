import React, { createContext, useState, useEffect, ReactNode } from 'react'
import authService from '../services/authService'

interface AuthContextProps {
  accessToken: string | null;
  idToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  logoutUser: () => Promise<void>;
  setAccessToken: (token: string | null) => void;
  setIdToken: (token: string | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

const initialAuthContext = {
  accessToken: null,
  idToken: null,
  isAuthenticated: false,
  loading: true,
  logoutUser: async() => Promise.resolve(),
  setAccessToken: () => { },
  setIdToken: () => { },
  setIsAuthenticated: () => { }
}

export const AuthContext = createContext<AuthContextProps>(initialAuthContext)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [idToken, setIdToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  const loadTokens = async() => {
    const tokens = await authService.loadTokens()
    if (tokens.storedAccessToken !== null && tokens.storedIdToken !== null) {
      const { storedAccessToken, storedIdToken } = tokens
      const payload = authService.decodeAccessToken(storedAccessToken)
      if (payload.exp !== undefined && payload.exp > Math.floor(Date.now() / 1000)) {
        setAccessToken(storedAccessToken)
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
      if (storedIdToken !== null) setIdToken(storedIdToken)
    }
    setLoading(false)
  }

  const logoutUser = async() => {
    try {
      await authService.logoutUser()
      setAccessToken(null)
      setIdToken(null)
      setIsAuthenticated(false)
    } catch (error) {
      throw new Error('Failed to logout.')
    }
  }

  useEffect(() => {
    const loadTokensIIFE = async() => {
      try {
        await loadTokens()
      } catch (error) {
        setLoading(false)
        setIsAuthenticated(false)
      }
    }
    loadTokensIIFE().catch(() => {
      setLoading(false)
      setIsAuthenticated(false)
    })
  }, [])
  return (
    <AuthContext.Provider
      value={{
        accessToken,
        setAccessToken,
        setIdToken,
        idToken,
        isAuthenticated,
        setIsAuthenticated,
        logoutUser,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
