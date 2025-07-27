import type { ReactNode } from 'clients/commons/platform/node_modules/@types/react'
import React from 'clients/commons/platform/node_modules/@types/react'
import Sidebar from '../../components/sidebar/sidebar'
import { useDefaultLayout } from './useDefaultLayout'

const DefaultLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { sidebarExpanded, handleSidebarToggle, theme, toggleTheme }
    = useDefaultLayout()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        sidebarExpanded={sidebarExpanded}
        toggleSidebar={handleSidebarToggle}
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
  )
}

export default DefaultLayout
