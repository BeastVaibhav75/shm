'use client'

import { useState } from 'react'
import { X, Plus, Upload } from 'lucide-react'

interface ToothDetailsProps {
  toothNumber: string
  data: any
  onUpdate: (data: any) => void
  onAddTreatment: (data: any) => void
  onAddImage: (data: any) => void
  onClose: () => void
  notationSystem: string
}

export function ToothDetails({
  toothNumber,
  data,
  onUpdate,
  onAddTreatment,
  onAddImage,
  onClose,
  notationSystem
}: ToothDetailsProps) {
  const [condition, setCondition] = useState(data?.condition || 'healthy')
  const [notes, setNotes] = useState(data?.notes || '')
  const [treatmentType, setTreatmentType] = useState('')
  const [treatmentNotes, setTreatmentNotes] = useState('')
  const [treatmentCost, setTreatmentCost] = useState('')
  const [activeTab, setActiveTab] = useState('info')
  
  // Display number based on notation system
  const displayNumber = notationSystem === 'universal' 
    ? convertFDItoUniversal(toothNumber)
    : toothNumber

  const handleUpdateTooth = () => {
    onUpdate({
      condition,
      notes
    })
  }

  const handleAddTreatment = () => {
    if (!treatmentType) return
    
    onAddTreatment({
      type: treatmentType,
      notes: treatmentNotes,
      cost: parseFloat(treatmentCost) || 0,
      date: new Date().toISOString()
    })
    
    // Reset form
    setTreatmentType('')
    setTreatmentNotes('')
    setTreatmentCost('')
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // In a real app, you'd upload this to a server
    // For now, we'll just create a data URL
    const reader = new FileReader()
    reader.onload = () => {
      onAddImage({
        url: reader.result as string,
        type: file.type.includes('image/') ? 'clinical' : 'xray',
        date: new Date().toISOString(),
        notes: 'Uploaded image'
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">
            Tooth {displayNumber} Details
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex border-b mb-4">
            <button
              className={`px-4 py-2 ${activeTab === 'info' ? 'border-b-2 border-blue-500 text-blue-500' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              Information
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'treatments' ? 'border-b-2 border-blue-500 text-blue-500' : ''}`}
              onClick={() => setActiveTab('treatments')}
            >
              Treatments
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'images' ? 'border-b-2 border-blue-500 text-blue-500' : ''}`}
              onClick={() => setActiveTab('images')}
            >
              Images
            </button>
          </div>
          
          {activeTab === 'info' && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="healthy">Healthy</option>
                  <option value="filling">Filling</option>
                  <option value="rct">Root Canal Treatment</option>
                  <option value="crown">Crown</option>
                  <option value="extraction">Extraction</option>
                  <option value="implant">Implant</option>
                  <option value="bridge">Bridge</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border rounded px-3 py-2 h-24"
                  placeholder="Add notes about this tooth..."
                />
              </div>
              
              <button
                onClick={handleUpdateTooth}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Update Tooth Information
              </button>
            </div>
          )}
          
          {activeTab === 'treatments' && (
            <div>
              <div className="mb-6">
                <h3 className="font-medium mb-2">Add New Treatment</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Treatment Type</label>
                    <select
                      value={treatmentType}
                      onChange={(e) => setTreatmentType(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select Treatment</option>
                      <option value="filling">Filling</option>
                      <option value="rct">Root Canal Treatment</option>
                      <option value="crown">Crown</option>
                      <option value="extraction">Extraction</option>
                      <option value="scaling">Scaling</option>
                      <option value="implant">Implant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cost</label>
                    <input
                      type="number"
                      value={treatmentCost}
                      onChange={(e) => setTreatmentCost(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Cost"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={treatmentNotes}
                    onChange={(e) => setTreatmentNotes(e.target.value)}
                    className="w-full border rounded px-3 py-2 h-20"
                    placeholder="Treatment notes..."
                  />
                </div>
                
                <button
                  onClick={handleAddTreatment}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
                >
                  <Plus size={16} className="mr-1" /> Add Treatment
                </button>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Treatment History</h3>
                {data?.treatments && data.treatments.length > 0 ? (
                  <div className="space-y-3">
                    {data.treatments.map((treatment: any, index: number) => (
                      <div key={index} className="border rounded p-3">
                        <div className="flex justify-between">
                          <span className="font-medium capitalize">{treatment.type}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(treatment.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm mt-1">{treatment.notes}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Cost: ₹{treatment.cost}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No treatments recorded</p>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'images' && (
            <div>
              <div className="mb-6">
                <h3 className="font-medium mb-2">Add New Image</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="tooth-image"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <label
                    htmlFor="tooth-image"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload size={24} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">
                      Click to upload X-ray or clinical photo
                    </span>
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Images</h3>
                {data?.images && data.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {data.images.map((image: any, index: number) => (
                      <div key={index} className="border rounded overflow-hidden">
                        <img
                          src={image.url}
                          alt={`Tooth ${toothNumber} - ${image.type}`}
                          className="w-full h-40 object-cover"
                        />
                        <div className="p-2">
                          <div className="flex justify-between">
                            <span className="capitalize text-sm font-medium">
                              {image.type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(image.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs mt-1">{image.notes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No images uploaded</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper function to convert FDI notation to Universal notation
function convertFDItoUniversal(fdiNumber: string): string {
  const fdiMap: Record<string, string> = {
    // Upper right quadrant (1)
    '18': '1', '17': '2', '16': '3', '15': '4', '14': '5', '13': '6', '12': '7', '11': '8',
    // Upper left quadrant (2)
    '21': '9', '22': '10', '23': '11', '24': '12', '25': '13', '26': '14', '27': '15', '28': '16',
    // Lower left quadrant (3)
    '38': '17', '37': '18', '36': '19', '35': '20', '34': '21', '33': '22', '32': '23', '31': '24',
    // Lower right quadrant (4)
    '41': '25', '42': '26', '43': '27', '44': '28', '45': '29', '46': '30', '47': '31', '48': '32'
  }
  
  return fdiMap[fdiNumber] || fdiNumber
}