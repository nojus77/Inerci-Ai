'use client'

import { useEffect } from 'react'

/**
 * Listens for Cal.com embed booking success events and fires Meta Pixel Lead event.
 * Cal.com embed communicates via postMessage with event type "bookingSuccessfulV2".
 */
export default function MetaPixelBookingTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handler = (e: MessageEvent) => {
      // Cal.com embed sends postMessage events with data.event
      const ev = e?.data?.event
      if (ev === 'bookingSuccessfulV2') {
        // Fire Meta Pixel Lead event
        if (typeof (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq === 'function') {
          (window as unknown as { fbq: (...args: unknown[]) => void }).fbq('track', 'Lead')
          // Optional: also fire CompleteRegistration
          // (window as unknown as { fbq: (...args: unknown[]) => void }).fbq('track', 'CompleteRegistration')
        }
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  return null
}
