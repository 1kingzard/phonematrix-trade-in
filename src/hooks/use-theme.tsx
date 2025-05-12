
import * as React from 'react';

type Theme = 'dark' | 'light' | 'system';

export function useTheme() {
  const [theme, setThemeState] = React.useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) || 'system'
  );

  React.useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      
      root.classList.toggle('dark', systemTheme === 'dark');
      return;
    }

    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const setTheme = React.useCallback((theme: Theme) => {
    localStorage.setItem('theme', theme);
    setThemeState(theme);
  }, []);

  return { theme, setTheme };
}
