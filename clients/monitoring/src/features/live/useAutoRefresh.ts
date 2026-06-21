import { useEffect, useRef } from 'react'

// Calls `callback` every `intervalMs` while `enabled`; always uses the latest callback.
export const useAutoRefresh = (
  callback: () => void,
  intervalMs: number,
  enabled: boolean
) => {
  const saved = useRef(callback)

  useEffect(() => { saved.current = callback }, [callback])

  useEffect(() => {
    if (!enabled) return

    const id = setInterval(() => saved.current(), intervalMs)

    return () => clearInterval(id)
  }, [intervalMs, enabled])
}
