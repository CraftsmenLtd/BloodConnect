import { useAuthenticator } from '@aws-amplify/ui-react';
import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap';

const NavBar = () => {
  const { signOut, user } = useAuthenticator((context) => [context.user]);

  return (
    <Navbar bg="dark" expand="lg" data-bs-theme="dark" style={{}}>
      <Container>
        <Navbar.Brand href="/">Bloodconnect</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="#/requests">Requests</Nav.Link>
            <Nav.Link href="#/trace">Trace</Nav.Link>
          </Nav>
          <Nav>
            <NavDropdown title={user.signInDetails?.loginId}>
              <NavDropdown.Item onClick={signOut}>
                sign out
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
