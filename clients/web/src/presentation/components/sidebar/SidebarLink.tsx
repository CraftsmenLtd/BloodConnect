import { NavLink, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { cn } from '@/utils';

interface SidebarLinkProps {
  to?: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
  sidebarExpanded: boolean;
  onClick?: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  to = '',
  icon,
  label,
  active,
  sidebarExpanded,
  onClick,
}) => {
  const { pathname } = useLocation();
  return (
    <li>
      <NavLink
        to={to || pathname}
        onClick={onClick}
        className={cn(
          'group relative flex items-center gap-2 rounded-sm py-2 px-2.5 transition-all duration-300 ease-in-out',
          { 'bg-primary': active }
        )}
      >
        <span className="flex-shrink-0">{icon}</span>
        <span
          className={`transition-opacity duration-300 ${sidebarExpanded ? 'opacity-100' : 'opacity-0'} ${sidebarExpanded ? 'visible' : 'invisible'} whitespace-nowrap`}
          style={{ width: sidebarExpanded ? 'auto' : '0', overflow: 'hidden' }}
        >
          {label}
        </span>
      </NavLink>
    </li>
  );
};

export default SidebarLink;
