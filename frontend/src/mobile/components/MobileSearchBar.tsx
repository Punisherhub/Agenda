import React from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface MobileSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const MobileSearchBar: React.FC<MobileSearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Buscar...'
}) => {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl active:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export default MobileSearchBar
