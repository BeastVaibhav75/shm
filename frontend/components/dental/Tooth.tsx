'use client'

import { useState } from 'react'

interface ToothProps {
  number: string
  data: any
  onClick: () => void
  isSelected: boolean
  notationSystem: string
}

// Color mapping for different tooth conditions
const conditionColors = {
  healthy: 'bg-green-100 border-green-500',
  filling: 'bg-blue-100 border-blue-500',
  rct: 'bg-red-100 border-red-500',
  crown: 'bg-purple-100 border-purple-500',
  extraction: 'bg-gray-300 border-gray-500',
  implant: 'bg-yellow-100 border-yellow-500',
  bridge: 'bg-indigo-100 border-indigo-500',
  default: 'bg-white border-gray-300'
}

export function Tooth({ number, data, onClick, isSelected, notationSystem }: ToothProps) {
  // Convert FDI to Universal notation if needed
  const displayNumber = notationSystem === 'universal' 
    ? convertFDItoUniversal(number)
    : number

  // Get the appropriate color based on tooth condition
  const getConditionClass = () => {
    if (!data) return conditionColors.default
    return conditionColors[data.condition as keyof typeof conditionColors] || conditionColors.default
  }

  return (
    <div 
      className={`
        relative flex flex-col items-center justify-center 
        border-2 rounded-md p-2 h-24 cursor-pointer transition-all
        ${getConditionClass()}
        ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : ''}
      `}
      onClick={onClick}
    >
      <div className="text-sm font-bold">{displayNumber}</div>
      
      {data?.treatments?.length > 0 && (
        <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full"></div>
      )}
      
      {data?.images?.length > 0 && (
        <div className="absolute top-1 left-1 w-3 h-3 bg-blue-500 rounded-full"></div>
      )}
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