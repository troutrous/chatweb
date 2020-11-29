import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Container, Form, Col, Row } from 'react-bootstrap';
import MessageList from '../Components/MessageList';
import 'bootstrap/dist/css/bootstrap.min.css';
import RoomInfo from '../Components/RoomInfo';
import VideoCall from '../Components/VideoCall';
import { useHistory } from 'react-router-dom';
import { app } from '../firebase';
import { getCookie, setCookie } from '../Commons/Cookie'

const Room = () => {
    const [user, setUser] = useState(null);
    const history = useHistory();
    const handleGotoSign = useCallback(() => history.replace('/sign'), [history]);
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
                .catch((err) => handleGotoSign());
        }
        return;
    }, []);
    return !user ?
        (
            null
        ) :
        (
            <Row className="row-cols-3 h-100 w-100 overflow-hidden m-0">
                <Col className="col-2 overflow-hidden h-100 w-100 p-0">
                    <MessageList />
                </Col>
                <Col className="col-8 h-100 w-100 p-0">
                    {/* <VideoCall /> */}
                </Col>
                <Col className="col-2 h-100 w-100 p-0">
                    <RoomInfo />
                </Col>
            </Row>
        );
}

export default Room;