
import * as React from 'react';

type Theme = 'light';

export function useTheme() {
  const [theme] = React.useState<Theme>('light');

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
  }, []);

  // Since we're removing dark mode, this is just a placeholder function
  const setTheme = React.useCallback(() => {
    // No-op function since dark mode is removed
    return;
  }, []);

  return { theme, setTheme };
}
