'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { Plus, Calendar, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TreatmentPlansPage() {
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTreatmentPlans = async () => {
      try {
        setLoading(true)
        const res = await api.get('/treatment-plans')
        setTreatmentPlans(res.data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching treatment plans:', error)
        toast.error('Failed to load treatment plans')
        setLoading(false)
      }
    }

    fetchTreatmentPlans()
  }, [])

  const updateStepStatus = async (planId: string, stepId: string, status: string) => {
    try {
      await api.put(`/treatment-plans/${planId}/steps/${stepId}`, { status })
      
      // Update local state
      const updatedPlans = treatmentPlans.map(plan => {
        if (plan._id === planId) {
          const updatedSteps = plan.steps.map((step: any) => {
            if (step._id === stepId) {
              return { ...step, status }
            }
            return step
          })
          
          // Recalculate progress
          const completedSteps = updatedSteps.filter((step: any) => step.status === 'completed').length
          const progress = Math.round((completedSteps / updatedSteps.length) * 100)
          
          return { 
            ...plan, 
            steps: updatedSteps,
            progress
          }
        }
        return plan
      })
      
      setTreatmentPlans(updatedPlans)
      toast.success('Treatment step updated')
    } catch (error) {
      console.error('Error updating step:', error)
      toast.error('Failed to update treatment step')
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Treatment Plans</h1>
          <Link href="/treatment-plans/create">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center">
              <Plus size={18} className="mr-2" /> New Treatment Plan
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="loading-spinner h-8 w-8"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {treatmentPlans.length > 0 ? (
              treatmentPlans.map((plan) => (
                <div key={plan._id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-bold">{plan.title}</h2>
                        <p className="text-gray-600">
                          Patient: {plan.patient?.name || 'Unknown'}
                          {plan.doctor && ` | Doctor: ${plan.doctor.name}`}
                        </p>
                      </div>
                      <Link href={`/treatment-plans/${plan._id}`}>
                        <button className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm">
                          View Details
                        </button>
                      </Link>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-gray-500">Start Date</span>
                        <p>{plan.startDate ? new Date(plan.startDate).toLocaleDateString() : 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Duration</span>
                        <p>{plan.estimatedDuration || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Total Cost</span>
                        <p>₹{plan.totalCost?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm font-medium">{plan.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${plan.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Treatment Steps</h3>
                      <div className="space-y-2">
                        {plan.steps.map((step: any) => (
                          <div key={step._id} className="border rounded p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">{step.title}</span>
                                {step.plannedDate && (
                                  <span className="text-sm text-gray-500 ml-2">
                                    <Calendar size={14} className="inline mr-1" />
                                    {new Date(step.plannedDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <select
                                  value={step.status}
                                  onChange={(e) => updateStepStatus(plan._id, step._id, e.target.value)}
                                  className={`text-sm rounded px-2 py-1 ${
                                    step.status === 'completed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : step.status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="completed">Completed</option>
                                </select>
                              </div>
                            </div>
                            {step.description && (
                              <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                            )}
                            {step.cost > 0 && (
                              <p className="text-sm text-gray-600 mt-1">Cost: ₹{step.cost.toFixed(2)}</p>
                            )}
                            {step.teethInvolved && step.teethInvolved.length > 0 && (
                              <p className="text-sm text-gray-600 mt-1">
                                Teeth: {step.teethInvolved.join(', ')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">No treatment plans found</p>
                <Link href="/treatment-plans/create">
                  <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Create Your First Treatment Plan
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}