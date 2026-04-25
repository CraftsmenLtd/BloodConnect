import React from 'clients/commons/platform/node_modules/@types/react'
import {
  FaMoon,
  FaSun,
  MdDashboard,
  MdSettings,
  MdLogout,
  MdReportProblem,
  MdChildCare
} from '../../assets/icons'
import SidebarLink from './SidebarLink'
import { useSidebar } from './useSidebar'

type SidebarProps = {
  sidebarExpanded: boolean;
  toggleSidebar: (isExpanded: boolean) => void;
  theme: string;
  toggleTheme: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({
  sidebarExpanded,
  toggleSidebar,
  theme,
  toggleTheme,
}) => {
  const { pathname, sidebar, handleToggleSidebar, handleSignOut } = useSidebar(
    sidebarExpanded,
    toggleSidebar
  )

  return (
    <aside
      ref={sidebar}
      className={`flex flex-col shadow-xl transition-all duration-300 ${
        sidebarExpanded
          ? 'w-[var(--sidebar-expanded-width)]'
          : 'w-[var(--sidebar-collapsed-width)]'
      }`}
    >
      <div className="flex p-1">
        <button
          type="button"
          className="cursor-pointer"
          onClick={handleToggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <img
            src="/blood-connect-icon.svg"
            alt="Blood Connect Logo"
            className="w-12 h-12"
          />
        </button>
      </div>

      <div className="no-scrollbar flex flex-col">
        <nav className="p-2">
          <ul className="mb-6 flex flex-col gap-1.5">
            <SidebarLink
              to="/dashboard"
              icon={<MdDashboard size={24} />}
              label="Dashboard"
              active={pathname.includes('dashboard')}
              sidebarExpanded={sidebarExpanded}
            />
            <SidebarLink
              to="/profile"
              icon={<MdSettings size={24} />}
              label="Profile"
              active={pathname.includes('profile')}
              sidebarExpanded={sidebarExpanded}
            />
          </ul>
        </nav>
      </div>

      <div className="no-scrollbar flex flex-col mt-auto">
        <nav className="p-2">
          <ul className="mb-3 flex flex-col gap-1.5">
            {/* TODO(CSS-20): replace mailto with POST /safety/report API call */}
            <SidebarLink
              icon={<MdReportProblem size={24} />}
              label="Report a safety concern"
              sidebarExpanded={sidebarExpanded}
              onClick={() => {
                window.location.href =
                  'mailto:support@bloodconnect.net?subject=%5BSafety%20report%5D&body=Describe%20what%20happened%3A%0A%0AReported%20user%20%2F%20post%20%28if%20known%29%3A%20N%2FA%0A'
              }}
            />
            <SidebarLink
              icon={<MdChildCare size={24} />}
              label="Child Safety Standards"
              sidebarExpanded={sidebarExpanded}
              onClick={() => {
                window.open('https://bloodconnect.net/child-safety.html', '_blank')
              }}
            />
            <SidebarLink
              icon={
                theme === 'light' ? <FaSun size={24} /> : <FaMoon size={24} />
              }
              label={theme === 'light' ? 'Light' : 'Dark'}
              sidebarExpanded={sidebarExpanded}
              onClick={toggleTheme}
            />
            <SidebarLink
              icon={<MdLogout size={24} />}
              label="Logout"
              sidebarExpanded={sidebarExpanded}
              onClick={() => {
                void handleSignOut()
              }}
            />
          </ul>
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
