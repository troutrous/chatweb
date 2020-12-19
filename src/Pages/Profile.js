import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Container, Col, Row, Image, Form } from 'react-bootstrap';
import { app, database } from '../firebase';
import { getCookie, setCookie } from '../Commons/Cookie';
import { useHistory } from 'react-router-dom';

import RoomListItem from '../Components/RoomListItem';

const roomCollectionRef = database.collection("rooms");
const userCollectionRef = database.collection("users");

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

const Profile = (props) => {
    const history = useHistory();
    const handleGotoSign = useCallback(() => history.replace('/sign'), [history]);
    const handleGotoRoom = useCallback((roomId) => history.replace('/room/' + roomId), [history]);
    const [user, setUser] = useState(null);
    const [userRef, setUserRef] = useState();
    const [roomCreate, setRoomCreate] = useState('');
    const [roomJoin, setRoomJoin] = useState('');
    const [roomJoined, setRoomJoined] = useState([]);

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
            const roomSnap = await roomCollectionRef.doc(roomJoinedSnap.id).get();
            if (roomSnap.exists) {
                setRoomJoined(roomJoined => [...roomJoined, { id: roomJoinedSnap.id, ...roomSnap.data() }]);
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
    return (
        <Row className="row-cols-3 h-100 w-100 overflow-hidden m-0">
            <Col className="col-4 p-0">
                <Alert className="w-100" variant='danger'>
                    <Button variant="danger" onClick={handleSignOut}>
                        <span className="mr-2">Đăng xuất</span>
                        <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-box-arrow-right" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z" />
                            <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z" />
                        </svg>
                    </Button>
                </Alert>

                <Alert className="w-100 d-flex align-items-center flex-column" variant='info'>
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
                        <label htmlFor="formNameRoom" className="h5 text-info">Tạo phòng mới</label>
                        <Form.Group controlId="formNameRoom" className="mt-2">
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
                        <label htmlFor="formNameRoom" className="h5 text-info">Vào phòng</label>
                        <Form.Group controlId="formNameRoom" className="mt-2">
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
    );
}

export default Profile