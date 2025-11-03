'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  User,
  Mail,
  Phone,
  Shield,
  Stethoscope
} from 'lucide-react'
import { getRoleColor } from '@/lib/utils'
import toast from 'react-hot-toast'

interface User {
  _id: string
  name: string
  email: string
  role: 'admin' | 'doctor' | 'receptionist'
  phone: string
  specialization?: string
  isActive: boolean
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'receptionist' as 'admin' | 'doctor' | 'receptionist',
    phone: '',
    specialization: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm, selectedRole])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (selectedRole) params.append('role', selectedRole)

      const response = await api.get(`/users?${params}`)
      setUsers(response.data.users)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.phone) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await api.post('/users', newUser)
      toast.success('User created successfully')
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'receptionist',
        phone: '',
        specialization: ''
      })
      setShowAddModal(false)
      fetchUsers()
    } catch (error: any) {
      console.error('Failed to create user:', error)
      const message = error.response?.data?.message || 'Failed to create user'
      toast.error(message)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      await api.delete(`/users/${userId}`)
      toast.success('User deleted successfully')
      fetchUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
      toast.error('Failed to delete user')
    }
  }

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await api.put(`/users/${userId}`, { isActive: !isActive })
      toast.success(`User ${!isActive ? 'activated' : 'deactivated'} successfully`)
      fetchUsers()
    } catch (error) {
      console.error('Failed to update user status:', error)
      toast.error('Failed to update user status')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'doctor':
        return <Stethoscope className="h-4 w-4" />
      case 'receptionist':
        return <User className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">Users</h1>
            <p className="text-secondary-600 mt-2">
              Manage system users and their permissions
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-md mt-4 sm:mt-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card"
        >
          <div className="card-content">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="input pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="input"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="doctor">Doctor</option>
                  <option value="receptionist">Receptionist</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card"
        >
          <div className="card-content p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="loading-spinner h-8 w-8"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr className="table-row">
                      <th className="table-head">User</th>
                      <th className="table-head">Contact</th>
                      <th className="table-head">Role</th>
                      <th className="table-head">Specialization</th>
                      <th className="table-head">Status</th>
                      <th className="table-head">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {users.map((user) => (
                      <tr key={user._id} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-600">
                                {user.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-secondary-900">
                                {user.name}
                              </p>
                              <p className="text-sm text-secondary-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-secondary-400" />
                            <span className="text-sm">
                              {user.phone}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(user.role)}
                            <span className={`badge ${getRoleColor(user.role)}`}>
                              {user.role}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="text-sm text-secondary-600">
                            {user.specialization || '-'}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                              className={`btn btn-sm ${user.isActive ? 'btn-warning' : 'btn-success'}`}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <Link href={`/users/${user._id}/edit`}>
                              <button className="p-1 hover:bg-secondary-100 rounded">
                                <Edit className="h-4 w-4 text-secondary-600" />
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="p-1 hover:bg-error-100 rounded"
                            >
                              <Trash2 className="h-4 w-4 text-error-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card-footer">
              <div className="flex items-center justify-between">
                <p className="text-sm text-secondary-500">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-outline btn-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="btn btn-outline btn-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                  Add New User
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="label">Full Name</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="input"
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="input"
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div>
                    <label className="label">Password</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="input"
                      placeholder="Enter password"
                    />
                  </div>
                  
                  <div>
                    <label className="label">Phone</label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      className="input"
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div>
                    <label className="label">Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                      className="input"
                    >
                      <option value="receptionist">Receptionist</option>
                      <option value="doctor">Doctor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  
                  {newUser.role === 'doctor' && (
                    <div>
                      <label className="label">Specialization</label>
                      <input
                        type="text"
                        value={newUser.specialization}
                        onChange={(e) => setNewUser({ ...newUser, specialization: e.target.value })}
                        className="input"
                        placeholder="Enter specialization"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setNewUser({
                        name: '',
                        email: '',
                        password: '',
                        role: 'receptionist',
                        phone: '',
                        specialization: ''
                      })
                    }}
                    className="btn btn-outline btn-md flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUser}
                    className="btn btn-primary btn-md flex-1"
                  >
                    Add User
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
