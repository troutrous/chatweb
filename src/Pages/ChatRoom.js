import React, { useState } from 'react';
import { Alert, Button, Container, Form, Col, Row } from 'react-bootstrap';
import MessageList from '../Components/MessageList';
import 'bootstrap/dist/css/bootstrap.min.css';
import RoomInfo from '../Components/RoomInfo';
import VideoCall from '../Components/VideoCall';
function ChatRoom() {
    const [signType, setSignType] = useState('Signin');
    const handleChangeSignType = () => {
        signType == "Signin" ? setSignType("Signup") : setSignType("Signin");
    }
    return (
            <Row className="row-cols-3 h-100 w-100 overflow-hidden m-0">
                <Col className="col-2 overflow-hidden h-100 w-100 p-0">
                    <MessageList />
                </Col>
                <Col className="col-8 h-100 w-100 p-0">
                    <VideoCall />
                </Col>
                <Col className="col-2 h-100 w-100 p-0">
                    <RoomInfo />
                </Col>
            </Row>
    );
}

export default ChatRoom;