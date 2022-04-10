import * as React from "react";

import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import Offcanvas from "react-bootstrap/Offcanvas";
import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";

class Sidebar extends React.Component {

    constructor(props) {
        super(props);
    }

    getConnectedClients() {
        var clients = [];
        for(var client of this.props.getState().connectedClients) {
            clients.push(<NavDropdown.Item href="#action4">{client.target}</NavDropdown.Item>);
        }
        return clients;
    }

    render() {
        return <Navbar bg="dark" variant="dark" expand={false}>
            <Container fluid>
                <Navbar.Brand href="#">SmartDIY</Navbar.Brand>
                <Navbar.Toggle aria-controls="offcanvasNavbar" />
                <Navbar.Offcanvas
                    id="offcanvasNavbar"
                    aria-labelledby="offcanvasNavbarLabel"
                    placement="start"
                    bg="dark" variant="dark"
                >
                    <Offcanvas.Header>
                        <Offcanvas.Title id="offcanvasNavbarLabel">SmartDIY</Offcanvas.Title>
                    </Offcanvas.Header>
                    <Offcanvas.Body>
                        <Nav className="justify-content-end flex-grow-1 pe-3">
                            <Nav.Link href="#home">Home</Nav.Link>
                            <NavDropdown title="Clients" id="offcanvasNavbarDropdown">
                                {this.getConnectedClients()}
                            </NavDropdown>
                        </Nav>
                    </Offcanvas.Body>
                </Navbar.Offcanvas>
            </Container>
        </Navbar>;
    } 

}

export default Sidebar;
