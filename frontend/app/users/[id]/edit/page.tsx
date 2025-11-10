'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

type Role = 'admin' | 'doctor' | 'receptionist'
interface UserForm { name: string; email: string; role: Role | ''; phone: string; specialization: string; isActive: boolean }

export default function EditUserPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [form, setForm] = useState<UserForm>({ name:'', email:'', role:'', phone:'', specialization:'', isActive:true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmNewPassword: '' })
  const [resettingPassword, setResettingPassword] = useState(false)

  useEffect(() => { (async () => {
    try {
      if (!id) return
      const { data } = await api.get(`/users/${id}`)
      const u = data?.user || data
      setForm({ name:u?.name||'', email:u?.email||'', role:(u?.role as Role)||'', phone:u?.phone||'', specialization:u?.specialization||'', isActive:Boolean(u?.isActive) })
    } catch (e:any) { toast.error(e?.response?.data?.message||'Failed to load user') } finally { setLoading(false) }
  })() }, [id])

  const change = (k: keyof UserForm, v:any) => setForm(p=>({ ...p, [k]: v }))

  const save = async () => {
    try {
      setSaving(true)
      const payload:any = { name:form.name, email:form.email, phone:form.phone, isActive:form.isActive }
      if (form.role) payload.role = form.role
      if (form.role === 'doctor') payload.specialization = form.specialization
      await api.put(`/users/${id}`, payload)
      toast.success('User updated')
      router.push(`/users/${id}`)
    } catch (e:any) { toast.error(e?.response?.data?.message||'Failed to update user') } finally { setSaving(false) }
  }

  const resetPassword = async () => {
    try {
      if (!passwordForm.newPassword) {
        toast.error('Enter a new password')
        return
      }
      if (passwordForm.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }
      if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
        toast.error('Passwords do not match')
        return
      }
      setResettingPassword(true)
      await api.put(`/users/${id}/reset-password`, { newPassword: passwordForm.newPassword })
      toast.success('Password reset successfully')
      setPasswordForm({ newPassword: '', confirmNewPassword: '' })
    } catch (e: any) {
      const apiMessage = e?.response?.data?.errors?.[0]?.msg || e?.response?.data?.message
      toast.error(apiMessage || 'Failed to reset password')
    } finally {
      setResettingPassword(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={()=>router.back()} className="p-2 rounded-md hover:bg-secondary-100"><ArrowLeft className="h-5 w-5 text-secondary-600"/></button>
            <h1 className="text-xl font-semibold">Edit User</h1>
          </div>
          {id && (<Link href={`/users/${id}`}><button className="btn btn-outline btn-sm">Back to Details</button></Link>)}
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-6 text-center"><p className="text-secondary-600">Loading user...</p></div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">Name *</label><input type="text" value={form.name} onChange={e=>change('name', e.target.value)} className="input" placeholder="Enter full name"/></div>
                <div><label className="label">Email *</label><input type="email" value={form.email} onChange={e=>change('email', e.target.value)} className="input" placeholder="Enter email"/></div>
                <div><label className="label">Role</label><select value={form.role} onChange={e=>change('role', e.target.value as Role)} className="input"><option value="">Select role</option><option value="admin">Admin</option><option value="doctor">Doctor</option><option value="receptionist">Receptionist</option></select></div>
                <div><label className="label">Phone *</label><input type="text" value={form.phone} onChange={e=>change('phone', e.target.value)} className="input" placeholder="Enter phone number"/></div>
                {form.role==='doctor' && (<div className="md:col-span-2"><label className="label">Specialization *</label><input type="text" value={form.specialization} onChange={e=>change('specialization', e.target.value)} className="input" placeholder="Enter specialization"/></div>)}
                <div><label className="label">Status</label><div className="flex items-center space-x-2"><input id="isActive" type="checkbox" checked={form.isActive} onChange={e=>change('isActive', e.target.checked)} /><label htmlFor="isActive">Active</label></div></div>
              </div>
              <div className="flex justify-end"><button onClick={save} disabled={saving} className="btn btn-primary btn-md flex items-center space-x-2"><Save className="h-4 w-4"/><span>{saving?'Saving...':'Save Changes'}</span></button></div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-secondary-900">Reset Password</h2>
                <p className="text-sm text-secondary-600">Set a temporary password for this user. They should change it after logging in.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">New Password *</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="input"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="label">Confirm Password *</label>
                  <input
                    type="password"
                    value={passwordForm.confirmNewPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                    className="input"
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={resetPassword}
                  disabled={resettingPassword}
                  className="btn btn-outline btn-md"
                >
                  {resettingPassword ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}