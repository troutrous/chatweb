import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Container, Form, Col, Row } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useHistory } from 'react-router-dom';
import { googleProvider, app, database } from '../firebase';
import { getCookie, setCookie } from '../Commons/Cookie'

const Sign = (props) => {
    const [signType, setSignType] = useState('Signin');

    const [emailSignin, setEmailSignin] = useState('');
    const [emailSignup, setEmailSignup] = useState('');

    const [passwordSignin, setPasswordSignin] = useState('');
    const [passwordSignup, setPasswordSignup] = useState('');

    const [nameSignup, setNameSignup] = useState('');
    const [phoneSignup, setPhoneSignup] = useState('');
    const [emailForget, setEmailForget] = useState('');
    const [reNewPass, setReNewPass] = useState('');
    const [otp, setOtp] = useState('');
    const [errorReset, setErrorReset] = useState();

    const [renderFlag, setRenderFlag] = useState(false);

    const history = useHistory();
    const handleGotoProfile = useCallback(() => history.replace('/profile'), [history]);

    const handleChangeSignType = () => {
        signType == "Signin" ? setSignType("Signup") : setSignType("Signin");
    }
    const handleResetPassword = () => {
        //gui mail
        setSignType("forgotPassword");
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
    const handleOnNameSignupChange = (event) => {
        setNameSignup(event.target.value);
    }
    const handleOnPhoneSignupChange = (event) => {
        setPhoneSignup(event.target.value);
    }
    const changeEmailForget = (event) => {
        setEmailForget(event.target.value);
    }
    const changeReNewPass = (event) => {
        setReNewPass(event.target.value);
    }
    const changeOtp = (event) => {
        setOtp(event.target.value);
    }
    const handleSignUp = async (event) => {
        event.preventDefault();
        if (!emailSignup || !passwordSignup || !nameSignup) {
            alert("Vui lòng nhập đầy đủ thông tin!");
            return;
        }
        try {
            await app.auth().createUserWithEmailAndPassword(emailSignup, passwordSignup);
            const currentUser = app.auth().currentUser;
            await currentUser.updateProfile({
                displayName: nameSignup,
            })
            const token = await getCurrentToken();
            if (token) {
                const currentUser = app.auth().currentUser;
                const userData = await database.collection('users').doc(currentUser.uid).get();
                if (!userData.exists) {
                    console.log('userDatanotexist')
                    await database.collection('users').doc(currentUser.uid).set({
                        userName: currentUser.displayName,
                        userEmail: currentUser.email,
                        userPhotoURL: currentUser.photoURL
                    });
                }
                setCookie('userToken', token);
                handleGotoProfile();
            }
        } catch (error) {
            console.log(error);
        }
    }
    const handleReset = async (event) => {
        event.preventDefault();
        try {
            await app.auth().sendPasswordResetEmail(emailForget);
            alert("Một email đã được gửi tới bạn! Hãy kiểm tra hộp thư ngay nhé!");
        } catch (error) {
            alert(error.message);
        }
    }

    const getCurrentToken = async () => {
        const currentUser = await app.auth().currentUser;
        if (currentUser) return await currentUser.getIdToken();
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
                    handleGotoProfile();
                })
                .catch((err) => {
                    setRenderFlag(true);
                    console.log(err);
                });
        } else {
            setRenderFlag(true);
        }
        return;
    }, []);
    const handleSignIn = async (event) => {
        event.preventDefault();
        try {
            await app.auth().signInWithEmailAndPassword(emailSignin, passwordSignin);
            const token = await getCurrentToken();
            if (token) {
                const currentUser = app.auth().currentUser;
                const userData = await database.collection('users').doc(currentUser.uid).get();
                if (!userData.exists) {
                    console.log('userDatanotexist')
                    await database.collection('users').doc(currentUser.uid).set({
                        userName: currentUser.displayName,
                        userEmail: currentUser.email,
                        userPhotoURL: currentUser.photoURL
                    });
                }
                setCookie('userToken', token);
                handleGotoProfile();
            }
        } catch (error) {
            alert(error.message);
        }
    }

    const handleSignInWithGoogle = async () => {
        try {
            const result = await app.auth().signInWithPopup(googleProvider)
            const token = result.credential.accessToken;

            const currentUser = app.auth().currentUser;
            const userData = await database.collection('users').doc(currentUser.uid).get();
            if (!userData.exists) {
                console.log(currentUser);
                await database.collection('users').doc(currentUser.uid).set({
                    userName: currentUser.displayName,
                    userEmail: currentUser.email,
                    userPhotoURL: currentUser.photoURL
                });
            }
            setCookie('userToken', token);
            handleGotoProfile();
        } catch (error) {
            // The email of the user's account used.
            var email = error.email;
            // The firebase.auth.AuthCredential type that was used.
            var credential = error.credential;
            console.log(error.code + error.message);
        }
    }
    return (
        <Container className="h-100 w-100" >
            {
                true && (
                    <Container className="d-flex flex-column justify-content-center pt-5">
                        {
                            signType == 'Signin' && (
                                <Form>
                                    <Form.Group controlId="formBasicEmail">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control type="email" placeholder="Enter email" value={emailSignin} onChange={handleOnEmailSigninChange} />
                                        <Form.Text className="text-muted">We'll never share your email wiYth anyone else.</Form.Text>
                                    </Form.Group>

                                    <Form.Group controlId="formBasicPassword">
                                        <Form.Label>Password</Form.Label>
                                        <Form.Control type="password" placeholder="Enter password" value={passwordSignin} onChange={handleOnPasswordSigninChange} />
                                    </Form.Group>

                                    <Form.Group className="d-flex justify-content-center">
                                        <Button variant="info" type="submit" className="w-100" onClick={handleSignIn}>Sign in</Button>
                                    </Form.Group>
                                    <Alert variant='info' className="d-flex justify-content-between">
                                        Don't have an account?
                            <Button variant="info" type="button" onClick={() => handleChangeSignType()}>Sign up</Button>
                                    </Alert>
                                    <Alert variant='info' className="d-flex justify-content-between">
                                        Forgot Password?
                            <Button variant="info" type="button" onClick={() => handleResetPassword()}>Reset Password</Button>
                                    </Alert>
                                    <Form.Group className="d-flex justify-content-center">
                                        <Alert variant='info w-100 d-flex justify-content-center'>
                                            <Button variant="light" type="button" className="w-50" onClick={handleSignInWithGoogle}>
                                                <img src="https://img.icons8.com/color/30/000000/google-logo.png" className="mr-2" />
                                Sign in with Google</Button>
                                        </Alert>
                                    </Form.Group>
                                </Form>
                            ) || ([])}
                        {
                            signType == 'Signup' && (
                                <Form>
                                    <Form.Row className="w-100">
                                        <Form.Group as={Col} controlId="formGridEmail" className="pl-0">
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control type="email" placeholder="Your email" value={emailSignup} onChange={handleOnEmailSignupChange} />
                                        </Form.Group>

                                        <Form.Group as={Col} controlId="formGridPassword" className="pr-0">
                                            <Form.Label>Password</Form.Label>
                                            <Form.Control type="password" placeholder="Your password" value={passwordSignup} onChange={handleOnPasswordSignupChange} />
                                        </Form.Group>
                                    </Form.Row>
                                    <Form.Row className="w-100">
                                        <Form.Group as={Col} controlId="formGridName1" className="px-0">
                                            <Form.Label>Full Name</Form.Label>
                                            <Form.Control placeholder="Your name" type="name" value={nameSignup} onChange={handleOnNameSignupChange} />
                                        </Form.Group>
                                    </Form.Row>
                                    <Form.Row className="d-flex justify-content-between w-100">
                                        <Button type="button" variant="danger" onClick={handleChangeSignType}>Back</Button>
                                        <Button variant="info" type="submit" onClick={handleSignUp}>Sign up</Button>
                                    </Form.Row>
                                </Form>
                            ) || ([])
                        }
                        {
                            signType == 'forgotPassword' && (
                                <Form>
                                    <Form.Row className="w-100">
                                        <Form.Group as={Col} controlId="formGridEmail" className="pl-0">
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control type="email" placeholder="Enter email" value={emailForget} onChange={changeEmailForget} />
                                        </Form.Group>

                                        {/* <Form.Group as={Col} controlId="formGridPassword" className="pr-0">
                                            <Form.Label>Confirm Password</Form.Label>
                                            <Form.Control type="password" placeholder="Confirm password" value={reNewPass} onChange={changeReNewPass} />
                                        </Form.Group> */}
                                    </Form.Row>
                                    {/* <Form.Row className="w-100">
                                        <Form.Group as={Col} controlId="formGridName1" className="px-0">
                                            <Form.Label>OTP</Form.Label>
                                            <Form.Control placeholder="We had send OTP to your mail" type="text" value={otp} onChange={changeOtp    } />
                                        </Form.Group>
                                    </Form.Row> */}
                                    <Form.Row className="d-flex justify-content-between w-100">
                                        <Button type="button" variant="danger" onClick={handleChangeSignType}>Back</Button>
                                        <Button variant="info" type="submit" onClick={handleReset}>Reset</Button>
                                    </Form.Row>
                                    <Form.Row className="w-100">
                                        <Form.Group as={Col} controlId="formGridName1" className="px-0">
                                            <Form.Label>{errorReset}</Form.Label>
                                        </Form.Group>
                                    </Form.Row>


                                </Form>
                            ) || ([])
                        }
                    </Container>
                )




            }
        </Container>
    );
}

export default Sign;