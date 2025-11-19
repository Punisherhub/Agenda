import React from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'

interface MobileFABProps {
  onClick: () => void
  label?: string
}

const MobileFAB: React.FC<MobileFABProps> = ({ onClick, label }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg active:bg-blue-700 transition-colors flex items-center justify-center z-30"
    >
      <PlusIcon className="w-6 h-6" />
      {label && (
        <span className="absolute -top-8 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {label}
        </span>
      )}
    </button>
  )
}

export default MobileFAB
