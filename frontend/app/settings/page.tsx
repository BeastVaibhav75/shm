'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user, refreshProfile } = useAuth()
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    specialization: ''
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        specialization: user.specialization || ''
      })
    }
  }, [user])

  const saveProfile = async () => {
    try {
      setSavingProfile(true)
      const payload: any = { name: profileForm.name, phone: profileForm.phone }
      if (user?.role === 'doctor' && profileForm.specialization) {
        payload.specialization = profileForm.specialization
      }
      await api.put('/auth/profile', payload)
      toast.success('Profile updated')
      await refreshProfile()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const changePassword = async () => {
    try {
      if (!passwordForm.currentPassword || !passwordForm.newPassword) {
        toast.error('Please fill all password fields')
        return
      }
      if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
        toast.error('New passwords do not match')
        return
      }
      setChangingPassword(true)
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      toast.success('Password changed successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
            <p className="text-secondary-600">Manage your account preferences</p>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white border border-secondary-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-secondary-600 mb-1">Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full border border-secondary-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-secondary-600 mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full border border-secondary-300 rounded-md px-3 py-2 bg-secondary-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm text-secondary-600 mb-1">Phone</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full border border-secondary-300 rounded-md px-3 py-2"
              />
            </div>
            {user?.role === 'doctor' && (
              <div>
                <label className="block text-sm text-secondary-600 mb-1">Specialization</label>
                <input
                  type="text"
                  value={profileForm.specialization}
                  onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                  className="w-full border border-secondary-300 rounded-md px-3 py-2"
                />
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="btn btn-primary btn-md w-full sm:w-auto"
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white border border-secondary-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Change Password</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-secondary-600 mb-1">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full border border-secondary-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-secondary-600 mb-1">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full border border-secondary-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-secondary-600 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmNewPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                className="w-full border border-secondary-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={changePassword}
              disabled={changingPassword}
              className="btn btn-secondary btn-md w-full sm:w-auto"
            >
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}