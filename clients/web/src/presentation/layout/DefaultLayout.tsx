import React, { ReactNode, useState, useEffect } from 'react';
import Sidebar from '@/presentation/components/sidebar';

const DefaultLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const storedSidebarState = localStorage.getItem('sidebar-expanded');
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(
    storedSidebarState === 'true'
  );

  const [theme, setTheme] = useState<'light' | 'dark'>(
    localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
  );

  const handleSidebarToggle = (isExpanded: boolean) => {
    setSidebarExpanded(isExpanded);
    localStorage.setItem('sidebar-expanded', isExpanded.toString());
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme); // Save theme to localStorage
  }, [theme]);
  console.log(theme);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        sidebarExpanded={sidebarExpanded}
        onToggle={handleSidebarToggle}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarExpanded
            ? 'ml-[var(--sidebar-expanded-width)]'
            : 'ml-[var(--sidebar-collapsed-width)]'
        }`}
      >
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DefaultLayout;
