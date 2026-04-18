import { useEffect, useState } from 'react';

/** Watches document.documentElement for the `dark` class. */
export const useThemeMode = (): 'dark' | 'light' => {
  const [mode, setMode] = useState<'dark' | 'light'>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  useEffect(() => {
    const check = () =>
      setMode(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return mode;
};
