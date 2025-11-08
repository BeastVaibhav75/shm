'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from './Sidebar'
import Header from './Header'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner h-8 w-8"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-secondary-50">
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>
      <div className="flex flex-col flex-1 lg:pl-64">
        <div className="sticky top-0 z-40 h-16 bg-white border-b border-border flex items-center">
          <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>
        <main className="flex-1 bg-secondary-50 overflow-x-hidden p-6">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
