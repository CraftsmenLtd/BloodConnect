import { useAuthenticator } from '@aws-amplify/ui-react';
import { Button, Navbar, Container, Nav } from 'react-bootstrap';

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
            <Button variant="outline-danger" onClick={signOut}>
              Sign out {user.signInDetails?.loginId}
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
