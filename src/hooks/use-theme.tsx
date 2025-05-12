
import * as React from 'react';

type Theme = 'light';

export function useTheme() {
  const [theme] = React.useState<Theme>('light');

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
  }, []);

  const setTheme = React.useCallback(() => {
    // No-op function since we're removing dark mode
  }, []);

  return { theme, setTheme };
}
