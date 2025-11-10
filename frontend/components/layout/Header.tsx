'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Bell, Search, Menu, User, Settings, LogOut } from 'lucide-react'

interface HeaderProps {
  onMenuToggle: () => void
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()

  const formatDisplayName = (name?: string, role?: string) => {
    if (!name) return 'User'
    if (role === 'doctor' && !/^Dr\.\s/i.test(name)) return `Dr. ${name}`
    return name
  }

  const handleLogout = () => {
    // This will be handled by the AuthContext
    window.location.href = '/login'
  }

  return (
    <header className="flex h-20 w-full items-center justify-between border-b border-secondary-200 bg-white px-4 md:px-6">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-md hover:bg-secondary-100"
        >
          <Menu className="h-5 w-5 text-secondary-600" />
        </button>
        
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold text-secondary-900">
            Dashboard
          </h1>
          <p className="text-sm text-secondary-500">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="hidden md:flex items-center relative">
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 rounded-md border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <Search className="absolute left-3 h-4 w-4 text-secondary-400" />
        </div>

        {/* Notifications */}
        <button className="p-2 rounded-md hover:bg-secondary-100 relative">
          <Bell className="h-5 w-5 text-secondary-600" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary-100"
          >
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="h-5 w-5 text-primary-600" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-secondary-900">
                {formatDisplayName(user?.name, user?.role)}
              </p>
              <p className="text-xs text-secondary-500">
                {user?.role || 'Role'}
              </p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-secondary-200 z-50">
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    router.push('/settings')
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100 flex items-center"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
