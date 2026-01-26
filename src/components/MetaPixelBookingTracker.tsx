'use client'

import { useEffect, useRef } from 'react'

/**
 * Listens for Cal.com embed booking success events and fires Meta Pixel Lead event.
 * Cal.com embed communicates via postMessage with event type "bookingSuccessfulV2".
 *
 * Includes deduplication: won't fire Lead if already fired in last 10 seconds.
 */
export default function MetaPixelBookingTracker() {
  const lastFiredRef = useRef<number>(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handler = (e: MessageEvent) => {
      // Cal.com embed sends postMessage events with data.event
      const ev = e?.data?.event
      if (ev === 'bookingSuccessfulV2') {
        const now = Date.now()
        // Dedupe: don't fire if we fired in the last 10 seconds
        if (now - lastFiredRef.current < 10000) {
          return
        }

        // Fire Meta Pixel Lead event
        const win = window as unknown as { fbq?: (...args: unknown[]) => void }
        if (typeof win.fbq === 'function') {
          win.fbq('track', 'Lead')
          lastFiredRef.current = now
        }
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  return null
}
