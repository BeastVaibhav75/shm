'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  Stethoscope,
  ClipboardList,
  UserCog,
  Activity,
  Pill,
  ClipboardList as TreatmentPlan
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'doctor', 'receptionist']
  },
  {
    name: 'Patients',
    href: '/patients',
    icon: Users,
    roles: ['admin', 'doctor', 'receptionist']
  },
  {
    name: 'Appointments',
    href: '/appointments',
    icon: Calendar,
    roles: ['admin', 'doctor', 'receptionist']
  },
  {
    name: 'Dental Charts',
    href: '/dental-charts',
    icon: Activity,
    roles: ['admin', 'doctor']
  },
  {
    name: 'Prescriptions',
    href: '/prescriptions',
    icon: Pill,
    roles: ['admin', 'doctor']
  },
  {
    name: 'Treatment Plans',
    href: '/treatment-plans',
    icon: TreatmentPlan,
    roles: ['admin', 'doctor']
  },
  {
    name: 'Treatments',
    href: '/treatments',
    icon: Stethoscope,
    roles: ['doctor']
  },
  {
    name: 'Users',
    href: '/users',
    icon: UserCog,
    roles: ['admin']
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: ClipboardList,
    roles: ['admin', 'doctor', 'receptionist']
  }
]

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || '')
  )

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'h-full w-full overflow-y-auto',
          isOpen ? 'block' : 'hidden lg:block'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-secondary-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Building2 className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-secondary-900">
                  Shuchi Dental
                </h1>
                <p className="text-xs text-secondary-500">Hospital Management</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-md hover:bg-secondary-100"
            >
              <X className="h-5 w-5 text-secondary-500" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-secondary-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-secondary-500 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                      : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
                  )}
                  onClick={() => {
                    // Close mobile sidebar when navigating
                    if (window.innerWidth < 1024) {
                      onToggle()
                    }
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-secondary-200">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
