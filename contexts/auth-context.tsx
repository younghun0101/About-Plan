'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthUser, User } from '@/lib/types'
import { apiRequest, clearAccessToken, getAccessToken, setAccessToken } from '@/lib/api'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  getOtherUser: () => User | null
}

const AuthContext = createContext<AuthContextType | null>(null)

const KNOWN_USERS: User[] = [
  {
    tbl_user_id: 'user-a-001',
    str_name: 'User A',
    str_email: 'usera@aboutplan.com',
    str_password_hash: '',
  },
  {
    tbl_user_id: 'user-b-002',
    str_name: 'User B',
    str_email: 'userb@aboutplan.com',
    str_password_hash: '',
  },
]

interface AuthResponse {
  token: string
  user: AuthUser
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      const token = getAccessToken()
      if (!token) {
        if (mounted) setIsLoading(false)
        return
      }

      try {
        const me = await apiRequest<AuthUser>('/api/auth/me')
        if (mounted) {
          setUser(me)
        }
      } catch {
        clearAccessToken()
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      mounted = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await apiRequest<AuthResponse>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
        { auth: false },
      )

      setAccessToken(response.token)
      setUser(response.user)
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : '로그인에 실패했습니다.'
      return { success: false, error: message }
    }
  }, [])

  const logout = useCallback(() => {
    clearAccessToken()
    setUser(null)
  }, [])

  const getOtherUser = useCallback(() => {
    if (!user) return null
    return KNOWN_USERS.find((candidate) => candidate.tbl_user_id !== user.id) || null
  }, [user])

  const value = useMemo(
    () => ({ user, isLoading, login, logout, getOtherUser }),
    [user, isLoading, login, logout, getOtherUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
