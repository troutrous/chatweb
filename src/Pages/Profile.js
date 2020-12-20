import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Container, Col, Row, Image, Form } from 'react-bootstrap';
import { app, database, emailProvider } from '../firebase';
import { getCookie, setCookie } from '../Commons/Cookie';
import { useHistory } from 'react-router-dom';

import RoomListItem from '../Components/RoomListItem';

const roomCollectionRef = database.collection("rooms");
const userCollectionRef = database.collection("users");

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

const Profile = (props) => {
    const history = useHistory();
    const handleGotoSign = useCallback(() => history.replace('/sign'), [history]);
    const handleGotoRoom = useCallback((roomId) => history.replace('/room/' + roomId), [history]);
    const [user, setUser] = useState(null);
    const [userRef, setUserRef] = useState();
    const [roomCreate, setRoomCreate] = useState('');
    const [roomJoin, setRoomJoin] = useState('');
    const [roomJoined, setRoomJoined] = useState([]);

    const [flagPopup, setFlagPopup] = useState('');

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newName, setNewName] = useState('');

    useEffect(() => {
        const userToken = getCookie('userToken');
        if (userToken) {
            getCurrentToken()
                .then((token) => {
                    setCookie('userToken', token);
                    setUser(app.auth().currentUser);

                    setUserRef(userCollectionRef.doc(app.auth().currentUser.uid));
                })
                .catch((err) => handleGotoSign());
        } else {
            handleGotoSign();
        }
        return;
    }, []);

    useEffect(() => {
        getRoomJoined();
        return;
    }, [userRef]);

    const getRoomJoined = async () => {
        if (!userRef) return;
        const roomJoinedSnapshot = await userRef.collection('roomJoined').get();
        roomJoinedSnapshot.forEach(async roomJoinedSnap => {
            let memberArray = [];
            const roomInfo = await roomCollectionRef.doc(roomJoinedSnap.id).get();
            const memberInRoomInfo = await roomCollectionRef.doc(roomJoinedSnap.id).collection('members').get();
            memberInRoomInfo.forEach(async member => {
                memberArray.push(member.data());
            })
            if (roomInfo.exists) {
                console.log(memberArray);
                setRoomJoined(roomJoined => [...roomJoined, { id: roomJoinedSnap.id, ...roomInfo.data(), memberArray }]);
            }
        });
    };

    const handleOnRoomCreateChange = (e) => {
        setRoomCreate(e.target.value);
    }
    const handleOnRoomJoinChange = (e) => {
        setRoomJoin(e.target.value);
    }

    const handleCreateRoom = async (e) => {
        if (!roomCreate) {
            return;
        }
        try {
            e.preventDefault();
            const newRoomRef = await roomCollectionRef.add({
                roomName: roomCreate,
                roomUserCreated: {
                    uid: user.uid,
                    email: user.email
                },
                roomCreatedAt: new Date(),
            });
            setRoomCreate('');
            handleGotoRoom(newRoomRef.id);
        } catch (error) {

        }
    }

    const handleJoinRoomWithID = async (e) => {
        e.preventDefault();
        if (!roomJoin) return;
        setRoomJoin('');
        handleGotoRoom(roomJoin);
    }

    const handleSignOut = async () => {
        try {
            await app.auth().signOut();
            setCookie('userToken', null);
            handleGotoSign();
        } catch (error) {
            console.log(error);
        }
    };
    const handlePopupChangePassword = async () => {
        if (flagPopup == "password") setFlagPopup("");
        else setFlagPopup("password");
    }
    const handleChangePassword = async () => {
        try {
            if (newPassword != confirmPassword) {
                throw new Error("Opps! Confirm password is different than new password");
            }
            await user.reauthenticateWithCredential(emailProvider.credential(user.email, oldPassword));
            await user.updatePassword(newPassword);
            console.log("Update password success");
            setFlagPopup("");
            alert("Update password success");
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.log(error);
            alert(error.message);
        }
    }
    const handleChangeInfo = async () => {
        try {
            await user.updateProfile({
                displayName: newName,
            })
            setNewName('');
            setFlagPopup("");
            alert("Update name success");

        } catch (error) {
            console.log(error);
            alert(error.message);
        }
    }
    const handlePopupChangeInfo = () => {
        if (flagPopup == "info") setFlagPopup("");
        else {
            setFlagPopup("info");
            setNewName(app.auth().currentUser.displayName);
        }
    }
    return (
        <div className="h-100 w-100 position-relative">
            {
                flagPopup == "password" && (
                    <Alert className="d-flex justify-content-center align-items-center h-100 w-100 position-absolute bg-dark bg-gradient pt-5" style={{ zIndex: 99, opacity: 0.9, top: 0, left: 0, padding: 300 }}>
                        <Form onSubmit={handleChangePassword} className="h-100 w-100 position-relative">
                            <Button variant="danger" className="mb-2" onClick={handlePopupChangePassword}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-backspace-fill" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M15.683 3a2 2 0 0 0-2-2h-7.08a2 2 0 0 0-1.519.698L.241 7.35a1 1 0 0 0 0 1.302l4.843 5.65A2 2 0 0 0 6.603 15h7.08a2 2 0 0 0 2-2V3zM5.829 5.854a.5.5 0 1 1 .707-.708l2.147 2.147 2.146-2.147a.5.5 0 1 1 .707.708L9.39 8l2.146 2.146a.5.5 0 0 1-.707.708L8.683 8.707l-2.147 2.147a.5.5 0 0 1-.707-.708L7.976 8 5.829 5.854z" />
                                </svg>
                            </Button>
                            <h6 htmlFor="formOldPassword" className="h6 text-info">Mật khẩu cũ</h6>
                            <Form.Group controlId="formOldPassword" className="mt-2">
                                <Form.Control type="password" placeholder="Mật khẩu cũ" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                            </Form.Group>
                            <h6 htmlFor="formNewPassword" className="h6 text-info">Mật khẩu mới</h6>
                            <Form.Group controlId="formNewPassword" className="mt-2">
                                <Form.Control type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                            </Form.Group>
                            <h6 htmlFor="formConfirmPassword" className="h6 text-info">Xác nhận mật khẩu</h6>
                            <Form.Group controlId="formConfirmPassword" className="mt-2">
                                <Form.Control type="password" placeholder="Xác nhận mật khẩu" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            </Form.Group>
                            <Form.Group className="d-flex justify-content-center">
                                <Button variant="info" type="button" className="btn w-100 mt-2" onClick={handleChangePassword}>
                                    <span className="mr-2">Change password</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-right-square" viewBox="0 0 16 16">
                                        <path fillRule="evenodd" d="M14 1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                                        <path fillRule="evenodd" d="M4 8a.5.5 0 0 0 .5.5h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5A.5.5 0 0 0 4 8z" />
                                    </svg>
                                </Button>
                            </Form.Group>
                        </Form>
                    </Alert>
                )
            }
            {
                flagPopup == "info" && (
                    <Alert className="d-flex justify-content-center align-items-center h-100 w-100 position-absolute bg-dark bg-gradient pt-5" style={{ zIndex: 99, opacity: 0.9, top: 0, left: 0, padding: 300 }}>
                        <Form onSubmit={handleChangeInfo} className="h-100 w-100 position-relative">
                            <Button variant="danger" className="mb-2" onClick={handlePopupChangeInfo}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-backspace-fill" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M15.683 3a2 2 0 0 0-2-2h-7.08a2 2 0 0 0-1.519.698L.241 7.35a1 1 0 0 0 0 1.302l4.843 5.65A2 2 0 0 0 6.603 15h7.08a2 2 0 0 0 2-2V3zM5.829 5.854a.5.5 0 1 1 .707-.708l2.147 2.147 2.146-2.147a.5.5 0 1 1 .707.708L9.39 8l2.146 2.146a.5.5 0 0 1-.707.708L8.683 8.707l-2.147 2.147a.5.5 0 0 1-.707-.708L7.976 8 5.829 5.854z" />
                                </svg>
                            </Button>
                            <h6 htmlFor="formNewName" className="h6 text-info">Tên</h6>
                            <Form.Group controlId="formNewName" className="mt-2">
                                <Form.Control type="name" placeholder="Tên" value={newName} onChange={(e) => setNewName(e.target.value)} />
                            </Form.Group>
                            <Form.Group className="d-flex justify-content-center">
                                <Button variant="success" type="button" className="btn w-100 mt-2" onClick={handleChangeInfo}>
                                    <span className="mr-2">Change information</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-right-square" viewBox="0 0 16 16">
                                        <path fillRule="evenodd" d="M14 1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                                        <path fillRule="evenodd" d="M4 8a.5.5 0 0 0 .5.5h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5A.5.5 0 0 0 4 8z" />
                                    </svg>
                                </Button>
                            </Form.Group>
                        </Form>
                    </Alert>
                )
            }
            {
                (
                    <Row className="row-cols-3 h-100 w-100 overflow-hidden m-0">
                        <Col className="col-4 p-0">
                            <Alert className="w-100" variant='dark' className="d-flex justify-content-between bg-gradient">
                                <Button variant="danger" onClick={handleSignOut} className="text-light bg-gradient">
                                    <span className="mr-2">Đăng xuất</span>
                                    <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-box-arrow-right" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z" />
                                        <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z" />
                                    </svg>
                                </Button>
                                <Button variant="info" onClick={handlePopupChangePassword} className="text-light bg-gradient">
                                    <span className="mr-2">Đổi mật khẩu</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-credit-card-2-front" viewBox="0 0 16 16">
                                        <path fillRule="evenodd" d="M14 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zM2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2z" />
                                        <path d="M2 5.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1z" />
                                        <path fillRule="evenodd" d="M2 8.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z" />
                                    </svg>
                                </Button>
                                <Button variant="success" onClick={handlePopupChangeInfo} className="text-light teal-500 bg-gradient">
                                    <span className="mr-2">Thay đổi thông tin</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil-square" viewBox="0 0 16 16">
                                        <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456l-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                                        <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z" />
                                    </svg>
                                </Button>
                            </Alert>

                            <Alert className="w-100 d-flex align-items-center flex-column position-relative" variant='info'>
                                {
                                    user?.photoURL && <Image variant='info' src={user.photoURL} /> || <Image variant='info' src="https://i.ibb.co/N3V4BWd/default96.png" />
                                }
                                {
                                    user?.displayName && <h5 variant='info' className="w-100 mt-2 text-center">{user.displayName}</h5> || <h5 className="text-center w-100 mt-2" variant='info'>Update...</h5>
                                }
                                {
                                    user?.email && <h5 className="text-center w-100 mt-2" variant='info'>{user.email}</h5> || <h5 className="text-center w-100 mt-2" variant='info'>Update...</h5>
                                }
                            </Alert>

                            <Alert className="w-100" variant='info'>
                                <Form onSubmit={handleCreateRoom}>
                                    <label htmlFor="formCreateRoom" className="h5 text-info">Tạo phòng mới</label>
                                    <Form.Group controlId="formCreateRoom" className="mt-2">
                                        <Form.Control onSubmit={handleCreateRoom} type="name" placeholder="Tên phòng" value={roomCreate} onChange={handleOnRoomCreateChange} />
                                    </Form.Group>
                                    <Form.Group className="d-flex justify-content-center">
                                        <Button variant="info" type="button" className="btn w-100 mt-2" onClick={handleCreateRoom}>
                                            <span className="mr-2">Create Room</span>
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-share" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                                            </svg>
                                        </Button>
                                    </Form.Group>
                                </Form>
                            </Alert>

                            <Alert className="w-100" variant='info'>
                                <Form onSubmit={handleJoinRoomWithID}>
                                    <label htmlFor="formJoinRoom" className="h5 text-info">Vào phòng</label>
                                    <Form.Group controlId="formJoinRoom" className="mt-2">
                                        <Form.Control type="name" placeholder="Mã phòng" value={roomJoin} onChange={handleOnRoomJoinChange} />
                                    </Form.Group>
                                    <Form.Group className="d-info justify-content-center">
                                        <Button variant="info" type="button" className="btn w-100 mt-2" onClick={handleJoinRoomWithID}>
                                            <span className="mr-2">Join Room</span>
                                            <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-share" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
                                            </svg>
                                        </Button>
                                    </Form.Group>
                                </Form>
                            </Alert>
                        </Col>
                        <Col className="col-8 p-0 bg-light">
                            <div className="list-group">
                                {
                                    roomJoined && roomJoined.map((room, index) => (
                                        <RoomListItem room={room} key={index} handleJoinRoom={handleGotoRoom} />
                                    ))
                                }
                            </div>
                        </Col>
                    </Row>
                )
            }
        </div>
    );
}

export default Profile