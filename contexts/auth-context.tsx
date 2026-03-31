'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { AuthUser, User } from '@/lib/types'
import { loadData, saveData } from '@/lib/store'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  getOtherUser: () => User | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const data = loadData()
    if (data.currentUser) {
      setUser(data.currentUser)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = loadData()
    const foundUser = data.users.find(
      (u) => u.str_email === email && u.str_password_hash === password
    )

    if (!foundUser) {
      return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
    }

    const authUser: AuthUser = {
      id: foundUser.tbl_user_id,
      name: foundUser.str_name,
      email: foundUser.str_email,
    }

    data.currentUser = authUser
    saveData(data)
    setUser(authUser)

    return { success: true }
  }, [])

  const logout = useCallback(() => {
    const data = loadData()
    data.currentUser = null
    saveData(data)
    setUser(null)
  }, [])

  const getOtherUser = useCallback(() => {
    if (!user) return null
    const data = loadData()
    return data.users.find((u) => u.tbl_user_id !== user.id) || null
  }, [user])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, getOtherUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
