import React from 'react';
import {
  FaMoon,
  FaSun,
  MdDashboard,
  MdSettings,
  MdLogout,
} from '../../assets/icons';
import SidebarLink from './SidebarLink';
import { useSidebar } from './useSidebar';

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
  );

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
                void handleSignOut();
              }}
            />
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
