/**
 * Utility functions for device detection
 */

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false

  // Check user agent
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera

  // Check for mobile devices
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  const isMobileUA = mobileRegex.test(userAgent)

  // Check screen size (mobile typically < 768px)
  const isMobileScreen = window.innerWidth < 768

  // Check touch capability
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  return isMobileUA || (isMobileScreen && isTouchDevice)
}

export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop'

  const width = window.innerWidth

  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false

  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false

  return /Android/.test(navigator.userAgent)
}
