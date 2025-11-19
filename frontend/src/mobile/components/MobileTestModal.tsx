import React from 'react'
import MobileModal from './MobileModal'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const MobileTestModal: React.FC<Props> = ({ isOpen, onClose }) => {
  console.log('MobileTestModal render, isOpen:', isOpen)

  if (!isOpen) {
    console.log('Modal não está aberto')
    return null
  }

  console.log('Renderizando modal')

  return (
    <MobileModal isOpen={isOpen} onClose={onClose} title="Teste">
      <div className="p-4">
        <p>Modal de teste funcionando!</p>
        <button
          onClick={onClose}
          className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg"
        >
          Fechar
        </button>
      </div>
    </MobileModal>
  )
}

export default MobileTestModal
