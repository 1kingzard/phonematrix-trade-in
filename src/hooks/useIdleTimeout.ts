import { useEffect, useRef } from 'react';

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'visibilitychange'];

/**
 * Calls `onIdle` after `timeoutMs` of no user activity.
 * Activity is also shared across tabs via localStorage.
 */
export const useIdleTimeout = (
  enabled: boolean,
  onIdle: () => void,
  timeoutMs = 30 * 60 * 1000,
) => {
  const cb = useRef(onIdle);
  cb.current = onIdle;

  useEffect(() => {
    if (!enabled) return;
    let timer: number | undefined;

    const reset = () => {
      if (document.visibilityState === 'hidden') return;
      try { localStorage.setItem('lastActivityAt', String(Date.now())); } catch { /* ignore */ }
      window.clearTimeout(timer);
      timer = window.setTimeout(() => cb.current(), timeoutMs);
    };

    // Resume from a previous session's last activity
    const last = Number(localStorage.getItem('lastActivityAt') || 0);
    if (last && Date.now() - last >= timeoutMs) {
      cb.current();
      return;
    }
    reset();

    EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      EVENTS.forEach(e => window.removeEventListener(e, reset));
    };
  }, [enabled, timeoutMs]);
};
