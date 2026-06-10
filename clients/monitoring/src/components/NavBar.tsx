import { useAuthenticator } from '@aws-amplify/ui-react'
import { Navbar, Container, Nav, NavDropdown, Spinner } from 'react-bootstrap'

const NavBar = () => {
  const { signOut, user, authStatus, error } = useAuthenticator()
  const isLoading = authStatus !== 'authenticated' || !user

  if (error) {
    alert(error)
  }

  return (
    <Navbar bg="dark" expand="lg" data-bs-theme="dark">
      <Container>
        <Navbar.Brand href="/">BloodConnect</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="#/">Map</Nav.Link>
            <Nav.Link href="#/searches">Searches</Nav.Link>
          </Nav>
          <Nav className="ms-auto">
            {isLoading ? (
              <Spinner animation="border" role='status' variant='primary' />
            ) : (
              <NavDropdown title={user.signInDetails?.loginId ?? user.username}>
                <NavDropdown.Item onClick={signOut}>
                  Sign out
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

export default NavBar
