import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Container, Form, Col, Row } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useHistory } from 'react-router-dom';
import { provider, app } from '../firebase';
import { getCookie, setCookie } from '../Commons/Cookie'

const Sign = (props) => {
    const [signType, setSignType] = useState('Signin');
    const [emailSignin, setEmailSignin] = useState('');
    const [emailSignup, setEmailSignup] = useState('');
    const [passwordSignin, setPasswordSignin] = useState('');
    const [passwordSignup, setPasswordSignup] = useState('');
    const [user, setUser] = useState(sessionStorage.getItem('user'));

    const history = useHistory();
    const handleGotoRoom = useCallback(() => history.push('/room'), [history]);
    const handleChangeSignType = () => {
        signType == "Signin" ? setSignType("Signup") : setSignType("Signin");
    }

    const handleOnEmailSigninChange = (event) => {
        setEmailSignin(event.target.value);
    }
    const handleOnPasswordSigninChange = (event) => {
        setPasswordSignin(event.target.value);
    }
    const handleOnEmailSignupChange = (event) => {
        setEmailSignup(event.target.value);
    }
    const handleOnPasswordSignupChange = (event) => {
        setPasswordSignup(event.target.value);
    }
    const handleSignUp = async (event) => {
        event.preventDefault();
        try {
            await app.auth().createUserWithEmailAndPassword(emailSignup, passwordSignup);
            const currentUser = app.auth().currentUser;
            const token = await getCurrentToken();
            if (token) {
                setCookie('userToken', token);
                setUser(currentUser);
                handleGotoRoom();
            }
        } catch (error) {
            console.log(error);
        }
    }

    const getCurrentToken = async () => {
        const currentUser = app.auth().currentUser;
        if (currentUser) return currentUser;
        return new Promise((resolve, reject) => {
            const waiting = setTimeout(() => {
                reject(new Error('Het thoi gian cho :('));
            }, 10000);
            const unsubscribe = app.auth().onAuthStateChanged((userState) => {
                if (!userState) {
                    reject(new Error('Chua dang nhap :('));
                    return;
                }
                const token = userState.getIdToken();
                if (!token) {
                    reject(new Error('Khong co token :('));
                    return;
                }
                resolve(token);
                unsubscribe();
            });
        })
    }

    useEffect(() => {
        const userToken = getCookie('userToken');
        if (userToken) {
            getCurrentToken()
                .then((token) => {
                    setCookie('userToken', token);
                    setUser(app.auth().currentUser);
                })
                .catch((err) => console.log(err));
        }
        return;
    }, []);


    const handleSignOut = async () => {
        try {
            await app.auth().signOut();
            setUser(null);
            setCookie('userToken', null);
        } catch (error) {
            console.log(error);
        }
    }
    const handleSignIn = async (event) => {
        event.preventDefault();
        try {
            await app.auth().signInWithEmailAndPassword(emailSignin, passwordSignin);
            const currentUser = app.auth().currentUser;
            const token = await getCurrentToken();
            if (token) {
                setCookie('userToken', token);
                setUser(currentUser);
                handleGotoRoom();
            }
        } catch (error) {
            alert(error.message);
        }
    }

    const handleSignInWithGoogle = () => {

        app.auth().signInWithPopup(provider).then(function (result) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            console.log(result);
            var token = result.credential.accessToken;
            setCookie('userToken', token);
            // The signed-in user info.
            var currentUser = result.user;
            setUser(currentUser);
            handleGotoRoom();
            // ...
        }).catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            // The email of the user's account used.
            var email = error.email;
            // The firebase.auth.AuthCredential type that was used.
            var credential = error.credential;
            // ...
        });
    }
    return (
        <Container className="d-flex flex-column justify-content-center pt-5">
            {
                signType == 'Signin' && (
                    <Form>
                        <Form.Group controlId="formBasicEmail">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control type="email" placeholder="Enter email" value={emailSignin} onChange={handleOnEmailSigninChange} />
                            <Form.Text className="text-muted">We'll never share your email with anyone else.</Form.Text>
                        </Form.Group>

                        <Form.Group controlId="formBasicPassword">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control type="password" placeholder="Enter password" value={passwordSignin} onChange={handleOnPasswordSigninChange} />
                        </Form.Group>

                        <Form.Group className="d-flex justify-content-center">
                            <Button variant="primary" type="submit" className="w-100" onClick={handleSignIn}>Sign in</Button>
                        </Form.Group>
                        <Alert variant='warning' className="d-flex justify-content-between mt-3">
                            Don't have an account?
                            <Button variant="primary" type="button" onClick={() => handleChangeSignType()}>Sign up</Button>
                        </Alert>
                        <Form.Row className="d-flex justify-content-between">
                            <Button variant="primary" type="button" onClick={handleSignInWithGoogle}>Sign in with Google</Button>
                        </Form.Row>
                    </Form>
                ) || (
                    <Form>
                        <Form.Row>
                            <Form.Group as={Col} controlId="formGridEmail">
                                <Form.Label>Email</Form.Label>
                                <Form.Control type="email" placeholder="Enter email" value={emailSignup} onChange={handleOnEmailSignupChange} />
                            </Form.Group>

                            <Form.Group as={Col} controlId="formGridPassword">
                                <Form.Label>Password</Form.Label>
                                <Form.Control type="password" placeholder="Password" value={passwordSignup} onChange={handleOnPasswordSignupChange} />
                            </Form.Group>
                        </Form.Row>
                        {/* <Form.Row>
                            <Form.Group as={Col} controlId="formGridAddress1">
                                <Form.Label>Address</Form.Label>
                                <Form.Control placeholder="1234 Main St" type="text" />
                            </Form.Group>
                        </Form.Row>
                        <Form.Row>
                            <Form.Group as={Col} controlId="formGridState">
                                <Form.Label>State</Form.Label>
                                <Form.Control as="select" defaultValue="Choose...">
                                    <option>Choose...</option>
                                    <option>Male</option>
                                    <option>Female</option>
                                </Form.Control>
                            </Form.Group>
                        </Form.Row> */}
                        <Form.Row className="d-flex justify-content-between">
                            <Button type="button" variant="primary" onClick={handleChangeSignType}>Back</Button>
                            <Button variant="primary" type="submit" onClick={handleSignUp}>Sign up</Button>
                        </Form.Row>
                    </Form>
                )
            }
            {
                user && <Button variant="danger" type="button" onClick={handleSignOut}>Sign out</Button>
            }
        </Container>
    );
}

export default Sign;