import React, { useState, useEffect, useCallback } from 'react';
import './RoomInfo.css';
import { Alert, Button, Container, Form, Col, Row } from 'react-bootstrap';
import { getCookie, setCookie } from '../../Commons/Cookie';
import { useHistory } from 'react-router-dom';


export default function RoomInfo(props) {
    const { user } = props;
    const { roomData } = props;
    const { setOffMembers } = props;
    const { closeConnections } = props;
    const { members } = props;
    const {roomIDParam} = props;
    const { handleBlockedUser } = props;
    const history = useHistory();
    const handleGotoProfile = useCallback(() => history.replace('/profile'), [history]);

    const [myself, setMyself] = useState(null);

    useEffect(() => {
        if (members && user) {
            const ms = members.find(member => member.memberID == user.uid);
            if (ms?.memberBlocked == true) {
                handleBackToProfile();
            }
            else {
                setMyself(ms);
            }
        }
    }, [members]);

    const handleBackToProfile = () => {
        setOffMembers().then(() => {
            closeConnections();
            handleGotoProfile();
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
            <Alert variant='info' className='text-center'>
                <h6>Room</h6>
                <h6>{roomData?.roomName}</h6>
                <h6>{roomIDParam}</h6>
            </Alert>
            <Alert variant='light' className="w-100 p-0 text-center m-0">
                <h6>Admin</h6>
                {
                    members && (
                        <div className="w-100 p-0">
                            {
                                members.map((member, index) => {
                                    if (member.memberAdmin) return (
                                        <div key={member.memberID + index} className="w-100 p-0">
                                            {
                                                member.memberBlocked && (
                                                    <Alert className="w-100 px-0" variant="danger">
                                                        <span>{member.memberName && member.memberName || member.memberEmail}</span>
                                                        {
                                                            myself?.memberAdmin == true && (
                                                                <div className='d-flex justify-content-around w-100 mt-2'>
                                                                    <Button variant='danger' onClick={() => handleBlockedUser({ member, type: 'Unbocked' })}>
                                                                        <span className="mr-2">Bỏ chặn</span>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person-x" viewBox="0 0 16 16">
                                                                            <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H1s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C9.516 10.68 8.289 10 6 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
                                                                            <path fillRule="evenodd" d="M12.146 5.146a.5.5 0 0 1 .708 0L14 6.293l1.146-1.147a.5.5 0 0 1 .708.708L14.707 7l1.147 1.146a.5.5 0 0 1-.708.708L14 7.707l-1.146 1.147a.5.5 0 0 1-.708-.708L13.293 7l-1.147-1.146a.5.5 0 0 1 0-.708z" />
                                                                        </svg>
                                                                    </Button>
                                                                    <Button variant='light' onClick={() => handleBlockedUser({ member, type: 'Unauthorize' })}>
                                                                        <span className="mr-2">Huỷ quyền</span>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-caret-down" viewBox="0 0 16 16">
                                                                            <path d="M3.204 5h9.592L8 10.481 3.204 5zm-.753.659l4.796 5.48a1 1 0 0 0 1.506 0l4.796-5.48c.566-.647.106-1.659-.753-1.659H3.204a1 1 0 0 0-.753 1.659z" />
                                                                        </svg>
                                                                    </Button>
                                                                </div>
                                                            )
                                                        }
                                                    </Alert>
                                                ) || (
                                                    <Alert className="w-100 px-0" variant="success">
                                                        <span>{member.memberName && member.memberName || member.memberEmail}</span>
                                                        {
                                                            myself?.memberAdmin == true && (
                                                                <div className='d-flex justify-content-around w-100 mt-2'>
                                                                    <Button variant='success' onClick={() => handleBlockedUser({ member, type: 'Blocked' })}>
                                                                        <span className="mr-2">Chặn</span>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person-check" viewBox="0 0 16 16">
                                                                            <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H1s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C9.516 10.68 8.289 10 6 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
                                                                            <path fillRule="evenodd" d="M15.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L12.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0z" />
                                                                        </svg>
                                                                    </Button>
                                                                    <Button variant='light' onClick={() => handleBlockedUser({ member, type: 'Unauthorize' })}>
                                                                        <span className="mr-2">Huỷ quyền</span>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-caret-down" viewBox="0 0 16 16">
                                                                            <path d="M3.204 5h9.592L8 10.481 3.204 5zm-.753.659l4.796 5.48a1 1 0 0 0 1.506 0l4.796-5.48c.566-.647.106-1.659-.753-1.659H3.204a1 1 0 0 0-.753 1.659z" />
                                                                        </svg>
                                                                    </Button>
                                                                </div>
                                                            )
                                                        }
                                                    </Alert>
                                                )
                                            }

                                        </div>
                                    )
                                })
                            }
                        </div>
                    )
                }
            </Alert>
            <Alert variant='light' className="w-100 p-0 text-center m-0">
                <h6>Member</h6>
                {
                    members && (
                        <div className="w-100 p-0">
                            {
                                members.map((member, index) => {
                                    if (!member.memberAdmin) return (
                                        <div key={member.memberID + index} className="w-100 p-0">
                                            {
                                                member.memberBlocked && (
                                                    <Alert className="w-100 px-0" variant="danger">
                                                        <span>{member.memberName && member.memberName || member.memberEmail}</span>
                                                        {
                                                            myself?.memberAdmin == true && (
                                                                <div className='d-flex justify-content-around w-100 mt-2'>
                                                                    <Button variant='danger' >
                                                                        <span className="mr-2" onClick={() => handleBlockedUser({ member, type: 'Unblocked' })}>Bỏ chặn</span>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person-x" viewBox="0 0 16 16">
                                                                            <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H1s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C9.516 10.68 8.289 10 6 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
                                                                            <path fillRule="evenodd" d="M12.146 5.146a.5.5 0 0 1 .708 0L14 6.293l1.146-1.147a.5.5 0 0 1 .708.708L14.707 7l1.147 1.146a.5.5 0 0 1-.708.708L14 7.707l-1.146 1.147a.5.5 0 0 1-.708-.708L13.293 7l-1.147-1.146a.5.5 0 0 1 0-.708z" />
                                                                        </svg>
                                                                    </Button>
                                                                    <Button variant='light' onClick={() => handleBlockedUser({ member, type: 'Authorize' })}>
                                                                        <span className="mr-2">Uỷ quyền</span>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-caret-up" viewBox="0 0 16 16">
                                                                            <path d="M3.204 11h9.592L8 5.519 3.204 11zm-.753-.659l4.796-5.48a1 1 0 0 1 1.506 0l4.796 5.48c.566.647.106 1.659-.753 1.659H3.204a1 1 0 0 1-.753-1.659z" />
                                                                        </svg>
                                                                    </Button>
                                                                </div>
                                                            )
                                                        }
                                                    </Alert>
                                                ) || (
                                                    <Alert className="w-100 px-0" variant="success">
                                                        <span>{member.memberName && member.memberName || member.memberEmail}</span>
                                                        {
                                                            myself?.memberAdmin == true && (
                                                                <div className='d-flex justify-content-around w-100 mt-2'>
                                                                    <Button variant='success' onClick={() => handleBlockedUser({ member, type: 'Blocked' })}>
                                                                        <span className="mr-2">Chặn</span>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person-check" viewBox="0 0 16 16">
                                                                            <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H1s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C9.516 10.68 8.289 10 6 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
                                                                            <path fillRule="evenodd" d="M15.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L12.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0z" />
                                                                        </svg>
                                                                    </Button>
                                                                    <Button variant='light' onClick={() => handleBlockedUser({ member, type: 'Authorize' })}>
                                                                        <span className="mr-2">Uỷ quyền</span>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-caret-up" viewBox="0 0 16 16">
                                                                            <path d="M3.204 11h9.592L8 5.519 3.204 11zm-.753-.659l4.796-5.48a1 1 0 0 1 1.506 0l4.796 5.48c.566.647.106 1.659-.753 1.659H3.204a1 1 0 0 1-.753-1.659z" />
                                                                        </svg>
                                                                    </Button>
                                                                </div>
                                                            )
                                                        }
                                                    </Alert>
                                                )
                                            }

                                        </div>
                                    )
                                })
                            }
                        </div>
                    )
                }
            </Alert>
        </div>
    );
}