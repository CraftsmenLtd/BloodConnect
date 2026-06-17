import { Nav } from 'react-bootstrap'
import { NavLink } from 'react-router-dom'

const links: { to: string; label: string; end?: boolean }[] = [
  { to: '/', label: 'Live', end: true },
  { to: '/searches', label: 'Searches' },
  { to: '/map', label: 'Map' },
  { to: '/lookup', label: 'Lookup' },
]

const NavSidebar = () => (
  <Nav
    className="flex-column bg-dark border-end border-secondary p-2"
    style={{ width: '11rem', minWidth: '11rem' }}>
    {links.map(({ to, label, end }) => (
      <Nav.Link key={to} as={NavLink} to={to} end={end} className="text-light">
        {label}
      </Nav.Link>
    ))}
  </Nav>
)

export default NavSidebar
