import React, { useState, useEffect, useCallback } from 'react';
import './RoomInfo.css';
import { Alert, Button, Container, Form, Col, Row } from 'react-bootstrap';
import { app } from '../../firebase';
import { getCookie, setCookie } from '../../Commons/Cookie'


export default function RoomInfo(props) {
    const { handleGotoSign } = props;
    const { user } = props;
    const { room } = props;
    const {createRoom} = props;
    const {joinRoom} = props;
    const [inputRoomID, setInputRoomID] = useState('');

    const handleSignOut = async () => {
        try {
            await app.auth().signOut();
            setCookie('userToken', null);
            handleGotoSign();
        } catch (error) {
            console.log(error);
        }
    };
    const handleOnInputRoomIDChange = (event) => {
        setInputRoomID(event.target.value);
    };
    
    return (
        <div className="roominfoContainer">
            <Button variant="danger" type="button" className="btn w-100" onClick={handleSignOut}>
                <span className="mr-2">Exit</span>
                <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-box-arrow-right" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z" />
                    <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z" />
                </svg>
            </Button>
            <Alert variant='primary text-center'>
                <h6>User</h6>
                {user.displayName && user.displayName || user.uid}
            </Alert>
            <Alert variant='primary text-center'>
                <h6>Room</h6>
                {room}
            </Alert>
            <Button variant="outline-primary" type="button" className="btn w-100 mb-2" onClick={createRoom}>
                <span className="mr-2">Create Room</span>
                <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-share" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                </svg>
            </Button>
            <Form.Group controlId="formJoinRoomByID">
                <Form.Label>Room ID</Form.Label>
                <Form.Control type="text" placeholder="Enter room id" value={inputRoomID} onChange={handleOnInputRoomIDChange} />
            </Form.Group>
            <Button variant="outline-primary" type="button" className="btn w-100" onClick={() => joinRoom(inputRoomID)}>
                <span className="mr-2">Join Room</span>
                <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-share" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
                </svg>
            </Button>
        </div>
    );
}