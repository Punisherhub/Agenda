import { useState, useEffect } from 'react'
import { isMobileDevice, getDeviceType } from './deviceDetector'

export const useDeviceDetect = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice())
      setDeviceType(getDeviceType())
    }

    // Initial check
    handleResize()

    // Listen for resize events
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return { isMobile, deviceType }
}
