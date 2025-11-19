import React from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const MobileModalSimples: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Teste Modal</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-blue-700 rounded-full text-2xl"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-green-100 border-2 border-green-500 rounded-lg p-6 text-center">
          <h3 className="text-2xl font-bold text-green-800 mb-4">
            ✅ Modal Funcionando!
          </h3>
          <p className="text-green-700 mb-4">
            Se você está vendo esta mensagem, o modal básico está funcionando.
          </p>
          <p className="text-sm text-gray-600">
            Agora sabemos que o problema está no conteúdo do modal completo.
          </p>
          <button
            onClick={onClose}
            className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

export default MobileModalSimples
