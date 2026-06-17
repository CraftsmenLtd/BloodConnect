import { Navbar, Container, Nav, NavDropdown, Spinner } from 'react-bootstrap'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuthenticator } from '@aws-amplify/ui-react'
import NavSidebar from './NavSidebar'
import { useAws } from '../hooks/AwsContext'

const CredentialsGate = () => {
  const { error } = useAws()

  return (
    <Container className="d-flex justify-content-center align-items-center text-light p-4">
      {error
        ? <div><div>{error.name}</div><div>{error.message}</div></div>
        : <Spinner animation="border" role="status" variant="primary" />}
    </Container>
  )
}

const AppShell = () => {
  const { signOut, user, authStatus } = useAuthenticator()
  const { credentials } = useAws()
  const isLoading = authStatus !== 'authenticated' || !user

  return (
    <div
      className="bg-dark"
      style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar bg="dark" data-bs-theme="dark" className="border-bottom border-secondary">
        <Container fluid>
          <Navbar.Brand as={NavLink} to="/">BloodConnect</Navbar.Brand>
          <Nav className="ms-auto">
            {isLoading
              ? <Spinner animation="border" role="status" variant="primary" size="sm" />
              : (
                <NavDropdown align="end" title={user.signInDetails?.loginId ?? user.username}>
                  <NavDropdown.Item onClick={signOut}>Sign out</NavDropdown.Item>
                </NavDropdown>
              )}
          </Nav>
        </Container>
      </Navbar>
      <div style={{ display: 'flex', flexGrow: 1, minHeight: 0 }}>
        <NavSidebar />
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
          {credentials ? <Outlet /> : <CredentialsGate />}
        </div>
      </div>
    </div>
  )
}

export default AppShell
