'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'doctor' | 'receptionist'
  phone: string
  specialization?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user && !!token

  useEffect(() => {
    // Check for stored token on mount
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        setToken(storedToken)
        // Set default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
        // Fetch user profile
        fetchProfile()
      } else {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile')
      setUser(response.data.user)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      // Token might be invalid, clear it
      localStorage.removeItem('token')
      setToken(null)
      delete api.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      const response = await api.post('/auth/login', { email, password })
      
      const { token: newToken, user: userData } = response.data
      
      // Store token and user data
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', newToken)
      }
      setToken(newToken)
      setUser(userData)
      
      // Set default authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      
      toast.success('Login successful!')
      return true
    } catch (error: any) {
      console.error('Login error:', error)
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    // Clear stored data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    setToken(null)
    setUser(null)
    
    // Clear authorization header
    delete api.defaults.headers.common['Authorization']
    
    toast.success('Logged out successfully')
    router.push('/login')
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
