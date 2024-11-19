import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { userSignOut } from '../../../../../commons/platform/aws/auth/awsAuth'
import { LoginPath } from '../../../constants/routeConsts'

type SidebarLogicReturn = {
  pathname: string;
  sidebar: React.RefObject<HTMLDivElement>;
  handleToggleSidebar: () => void;
  handleSignOut: () => Promise<void>;
}

export const useSidebar = (
  sidebarExpanded: boolean,
  toggleSidebar: (isExpanded: boolean) => void
): SidebarLogicReturn => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const sidebar = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    toggleSidebar(sidebarExpanded)
  }, [sidebarExpanded, toggleSidebar])

  const handleToggleSidebar = (): void => {
    toggleSidebar(!sidebarExpanded)
  }

  const handleSignOut = async(): Promise<void> => {
    await userSignOut()
    navigate(LoginPath)
  }

  return {
    pathname,
    sidebar,
    handleToggleSidebar,
    handleSignOut
  }
}
