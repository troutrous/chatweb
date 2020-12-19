import React, { useState, useEffect, useCallback } from 'react';
import './RoomInfo.css';
import { Alert, Button, Container, Form, Col, Row } from 'react-bootstrap';
import { getCookie, setCookie } from '../../Commons/Cookie';
import { useHistory } from 'react-router-dom';


export default function RoomInfo(props) {
    const { user } = props;
    const { roomid } = props;
    const { setOffMembers } = props;
    const { closeConnections } = props;
    const history = useHistory();
    const handleGotoRoom = useCallback((roomId) => history.replace('/profile'), [history]);

    const handleBackToProfile = () => {
        setOffMembers().then(() => {
            closeConnections();
            handleGotoRoom();
        })
    }
    return (
        <div className="roominfoContainer">
            <Button variant="danger" type="button" className="btn w-100" onClick={handleBackToProfile}>
                <span className="mr-2">Exit</span>
                <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-box-arrow-right" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z" />
                    <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z" />
                </svg>
            </Button>
            <Alert variant='info text-center'>
                <h6>User</h6>
                {user.displayName && user.displayName || user.uid}
            </Alert>
            <Alert variant='info text-center'>
                <h6>Room</h6>
                <h6>{roomid}</h6>
            </Alert>
        </div>
    );
}