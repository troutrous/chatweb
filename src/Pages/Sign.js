import React, { useState } from 'react';
import { Alert, Button, Container, Form, Col, Row } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
function Sign() {
    const [signType, setSignType] = useState('Signin');
    const handleChangeSignType = () => {
        signType == "Signin" ? setSignType("Signup") : setSignType("Signin");
    }
    return (
        <Container className="d-flex flex-column justify-content-center pt-5">
            {
                signType == 'Signin' && (
                    <Form>
                        <Form.Group controlId="formBasicEmail">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control type="email" placeholder="Enter email" />
                            <Form.Text className="text-muted">We'll never share your email with anyone else.</Form.Text>
                        </Form.Group>

                        <Form.Group controlId="formBasicPassword">
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" placeholder="Password" />
                        </Form.Group>

                        <Form.Group className="d-flex justify-content-center">
                            <Button variant="primary" type="submit" className="w-100">Sign in</Button>
                        </Form.Group>
                        <Alert variant='dark' className="d-flex justify-content-between mt-3">
                            Don't have an account?
                            <Button variant="info" type="button" onClick={() => handleChangeSignType()}>Sign up</Button>
                        </Alert>
                    </Form>
                ) || (
                    <Form>
                        <Form.Row>
                            <Form.Group as={Col} controlId="formGridEmail">
                                <Form.Label>Email</Form.Label>
                                <Form.Control type="email" placeholder="Enter email" />
                            </Form.Group>

                            <Form.Group as={Col} controlId="formGridPassword">
                                <Form.Label>Password</Form.Label>
                                <Form.Control type="password" placeholder="Password" />
                            </Form.Group>
                        </Form.Row>

                        <Form.Group controlId="formGridAddress1">
                            <Form.Label>Address</Form.Label>
                            <Form.Control placeholder="1234 Main St" />
                        </Form.Group>

                        <Form.Group controlId="formGridAddress2">
                            <Form.Label>Address 2</Form.Label>
                            <Form.Control placeholder="Apartment, studio, or floor" />
                        </Form.Group>

                        <Form.Row>
                            <Form.Group as={Col} controlId="formGridCity">
                                <Form.Label>City</Form.Label>
                                <Form.Control />
                            </Form.Group>

                            <Form.Group as={Col} controlId="formGridState">
                                <Form.Label>State</Form.Label>
                                <Form.Control as="select" defaultValue="Choose...">
                                    <option>Choose...</option>
                                    <option>...</option>
                                </Form.Control>
                            </Form.Group>

                            <Form.Group as={Col} controlId="formGridZip">
                                <Form.Label>Zip</Form.Label>
                                <Form.Control />
                            </Form.Group>
                        </Form.Row>
                        <Form.Row className="d-flex justify-content-between">
                            <Button type="button" class="btn btn-outline-success" onClick={() => handleChangeSignType()}>Back</Button>
                            <Button variant="primary" type="submit" >Sign up</Button>
                        </Form.Row>
                    </Form>
                )
            }
        </Container>
    );
}

export default Sign;