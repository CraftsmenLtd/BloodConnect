import { NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'clients/commons/platform/node_modules/@types/react'
import { cn } from '../../../utils'

type SidebarLinkProps = {
  to?: string | null;
  icon: ReactNode;
  label: string;
  active?: boolean;
  sidebarExpanded: boolean;
  onClick?: () => void;
};

const SidebarLink: React.FC<SidebarLinkProps> = ({
  to = null,
  icon,
  label,
  active = false,
  sidebarExpanded,
  onClick,
}) => {
  const { pathname } = useLocation()

  const commonClasses = cn(
    'group relative flex items-center gap-2 rounded-sm py-2 px-2.5 transition-all duration-300 ease-in-out',
    { 'bg-primary': active }
  )

  const labelClasses = `transition-opacity duration-300 ${sidebarExpanded ? 'opacity-100' : 'opacity-0'} ${sidebarExpanded ? 'visible' : 'invisible'} whitespace-nowrap`

  return (
    <li>
      {to !== null ? (
        <NavLink
          to={to !== '' ? to : pathname}
          onClick={onClick}
          className={commonClasses}
        >
          <span className="flex-shrink-0">{icon}</span>
          <span
            className={labelClasses}
            style={{
              width: sidebarExpanded ? 'auto' : '0',
              overflow: 'hidden',
            }}
          >
            {label}
          </span>
        </NavLink>
      ) : (
        <button type="button" onClick={onClick} className={commonClasses}>
          <span className="flex-shrink-0">{icon}</span>
          <span
            className={labelClasses}
            style={{
              width: sidebarExpanded ? 'auto' : '0',
              overflow: 'hidden',
            }}
          >
            {label}
          </span>
        </button>
      )}
    </li>
  )
}

export default SidebarLink
