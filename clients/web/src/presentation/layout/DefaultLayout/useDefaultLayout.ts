import { useState, useEffect } from 'react';

type UseDefaultLayoutReturn = {
  sidebarExpanded: boolean;
  handleSidebarToggle: (isExpanded: boolean) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
};

export const useDefaultLayout = (): UseDefaultLayoutReturn => {
  const storedSidebarState = localStorage.getItem('sidebar-expanded');
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(
    storedSidebarState === 'true'
  );

  const [theme, setTheme] = useState<'light' | 'dark'>(
    localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
  );

  const handleSidebarToggle = (isExpanded: boolean): void => {
    setSidebarExpanded(isExpanded);
    localStorage.setItem('sidebar-expanded', isExpanded.toString());
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = (): void => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return {
    sidebarExpanded,
    handleSidebarToggle,
    theme,
    toggleTheme,
  };
};
