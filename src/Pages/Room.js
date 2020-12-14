import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Container, Form, Col, Row } from 'react-bootstrap';
import MessageList from '../Components/MessageList';
import 'bootstrap/dist/css/bootstrap.min.css';
import RoomInfo from '../Components/RoomInfo';
import VideoCall from '../Components/VideoCall';
import { useHistory } from 'react-router-dom';
import { app, database } from '../firebase';
import { getCookie, setCookie } from '../Commons/Cookie';
import { useCollectionData } from 'react-firebase-hooks/firestore';

const configuration = {
    iceServers: [
        {
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
            ],
        },
    ],
    iceCandidatePoolSize: 10,
};

const constraints = {
    'audio': { 'echoCancellation': true },
    'video': {
        'width': 300,
        'height': 200,
        cursor: 'always' | 'motion' | 'never',
        displaySurface: 'application' | 'browser' | 'monitor' | 'window'
    }
}

const roomCollectionRef = database.collection("rooms");
const userCollectionRef = database.collection("users");

const Room = (props) => {

    const [roomIDParam, setRoomIDParam] = useState(props.match.params.id);

    const [user, setUser] = useState(null);
    const [room, setRoom] = useState(null);

    const [roomRef, setRoomRef] = useState();
    const [userRef, setUserRef] = useState();

    const [localStream, setLocalStream] = useState();
    // const [remoteStream, setRemoteStream] = useState(new MediaStream());
    const [localConnections, setLocalConnections] = useState([]);
    const [query, setQuery] = useState(null);
    const [messagesRef, setMessagesRef] = useState(null);
    const [messages] = useCollectionData(query, { idField: 'id' });
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

        if (!userToken) { handleGotoSign(); return; }
        getCurrentToken()
            .then((token) => {
                setCookie('userToken', token);
                setUser(app.auth().currentUser);
                setUserRef(userCollectionRef.doc(app.auth().currentUser.uid));
                setRoomRef(roomCollectionRef.doc(roomIDParam));
            })
            .catch((err) => handleGotoSign())
        return () => {

        };
    }, []);

    const setOnMembers = async () => {
        if (!roomRef) return null;

        const membersRef = roomRef.collection('members');
        const membersSnapshot = await membersRef.where('memberID', '==', user.uid).get();
        let localMemberRef;
        if (!membersSnapshot.empty) {
            membersSnapshot.forEach(async memberSnap => {
                localMemberRef = await membersRef.doc(memberSnap.id)
                await localMemberRef.update({
                    memberStatus: true,
                    memberTimeJoin: new Date(),
                })
            });
        } else {
            localMemberRef = await membersRef.doc();
            await localMemberRef.set({
                memberID: user.uid,
                memberTimeJoin: new Date(),
                memberStatus: true,
            });
        }
        //join room
        const userStream = (await navigator.mediaDevices.getUserMedia(constraints));
        setLocalStream(userStream);
        const localMember = (await localMemberRef.get()).data();

        let unsubscribeMembers = roomRef.collection('members').onSnapshot((doc) => {
            debugger;
            doc.docChanges().forEach(async (change) => {
                const memberChange = change.doc.data();
                if (change.type === 'modified') {
                    if (localMember.memberTimeJoin - memberChange.memberTimeJoin < 0 && memberChange.memberStatus == true && localMember.memberID != memberChange.memberID) {
                        // roomRef.collection('peerConnections').doc().set(
                        //     {
                        //         memberOfferID: localMember.memberID,
                        //         memberAnswerID: memberChange.memberID,
                        //         connectedAt: new Date()
                        //     }
                        // );
                        console.log("create connected", memberChange);
                        debugger;
                    }
                }
            })
        });

        return unsubscribeMembers;
    }

    const setOffMembers = async () => {
        if (!roomRef) return;
        const membersSnapshot = await roomRef.collection('members').where('memberID', '==', user.uid).get();
        if (!membersSnapshot.empty) {
            membersSnapshot.forEach(memberSnap => {
                roomRef.collection('members').doc(memberSnap.id).update({
                    memberStatus: false,
                })
            });
            return;
        };
    }

    const setRoomJoined = async () => {
        if (!userRef) return;
        const roomJoinedSnapshot = await userRef.collection('roomJoined').doc(roomIDParam).get();
        if (!roomJoinedSnapshot.exists) {
            userRef.collection('roomJoined').doc(roomIDParam).set({
                joinedAt: new Date()
            });
        }
    };

    useEffect(() => {
        if (!roomRef) return null;

        let membersRef = roomRef.collection('members');
        let membersSnapshot;
        let localMemberRef;
        let localMember;
        let unsubscribeMembers = null;
        let unsubscribeConnections = null;
        membersRef.where('memberID', '==', user.uid).get()
            .then((membersSnapshotPromise) => {
                membersSnapshot = membersSnapshotPromise;
            })
            .then(() => {
                if (!membersSnapshot.empty) {
                    membersSnapshot.forEach(async memberSnap => {
                        localMemberRef = membersRef.doc(memberSnap.id);
                        localMemberRef.update({
                            memberStatus: true,
                            memberTimeJoin: new Date(),
                        })
                    });
                } else {
                    localMemberRef = membersRef.doc();
                    localMemberRef.set({
                        memberID: user.uid,
                        memberTimeJoin: new Date(),
                        memberStatus: true,
                    });
                }
            })
            .then(() => {
                return localMemberRef.get();
            })
            .then((localMemberPromise) => {
                localMember = localMemberPromise.data();
                unsubscribeMembers = roomRef.collection('members').onSnapshot((doc) => {
                    doc.docChanges().forEach(async (change) => {
                        const memberChange = change.doc.data();
                        if (change.type === 'modified' && localMember.memberTimeJoin - memberChange.memberTimeJoin < 0 && memberChange.memberStatus == true && localMember.memberID != memberChange.memberID) {
                                // roomRef.collection('peerConnections').doc().set(
                                //     {
                                //         memberOfferID: localMember.memberID,
                                //         memberAnswerID: memberChange.memberID,
                                //         connectedAt: new Date()
                                //     }
                                // );
                                console.log('connected modified');
                        }
                        else if(change.type === 'added' && memberChange.memberStatus == true && localMember.memberTimeJoin - memberChange.memberTimeJoin < 0 && localMember.memberID != memberChange.memberID) {
                            console.log('connected added');
                            console.log(localMember.memberID);
                            console.log(localMember.memberTimeJoin);
                            console.log(memberChange.memberID);
                            console.log(memberChange.memberTimeJoin);
                        }
                    })
                });
            })
            // .then(() => {
            //     const timeStart = new Date();
            //     unsubscribeConnections = roomRef.collection('peerConnections').onSnapshot((snapshot) => {
                    
            //         snapshot.docChanges().forEach(async (connectionRef) => {
            //             let connectionData = connectionRef.doc.data();
            //             console.log(timeStart - connectionData.connectedAt.toDate());
            //             if (connectionRef.type === 'added' && connectionData.memberOfferID == user.uid && timeStart - connectionData.connectedAt.toDate() < 0) {
            //                 console.log("add peerConnections with offer");
            //             }
            //             if (connectionRef.type === 'added' && connectionData.memberAnswerID == user.uid && timeStart - connectionData.connectedAt.toDate() < 0) {
            //                 console.log("add peerConnections with answer");

            //                 // let tempConnections = localConnections;
            //                 // tempConnections.push(connectionData);
            //                 // setLocalConnections(tempConnections);

            //                 // const peerConnection = new RTCPeerConnection(configuration);
            //                 // const remoteStream = new MediaStream();
            //                 // document.querySelector('video#remoteVideo').srcObject = remoteStream;

            //                 // userStream.getTracks().forEach(track => {
            //                 //     peerConnection.addTrack(track, userStream);
            //                 // });

            //                 // peerConnection.onicecandidate = (event) => {
            //                 //     if (!event.candidate) {
            //                 //         console.log("Got Final Candidate!");
            //                 //         return;
            //                 //     }
            //                 //     console.log('Got candidate: ', event.candidate);
            //                 //     connectionRef.doc.ref.collection("calleeCandidates").add(event.candidate.toJSON());
            //                 // }

            //                 // connectionRef.doc.ref.onSnapshot(async (doc) => {
            //                 //     console.log("connectionRef CHANGE")
            //                 //     if (!doc.data().answer && doc.data().offer) {
            //                 //         const offer = doc.data().offer;
            //                 //         await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            //                 //         const answer = await peerConnection.createAnswer();
            //                 //         await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

            //                 //         const roomWithAnswer = {
            //                 //             answer: {
            //                 //                 type: answer.type,
            //                 //                 sdp: answer.sdp,
            //                 //             },
            //                 //         };
            //                 //         await doc.ref.update(roomWithAnswer);

            //                 //         connectionRef.doc.ref.collection('callerCandidates').onSnapshot(snapshot => {
            //                 //             snapshot.docChanges().forEach(async changeIceCandidate => {
            //                 //                 if (changeIceCandidate.type === 'added') {
            //                 //                     console.log("addIceCandidate");
            //                 //                     await peerConnection.addIceCandidate(changeIceCandidate.doc.data());
            //                 //                 }
            //                 //                 console.log("addIceCandidate");
            //                 //             });
            //                 //         });
            //                 //     }
            //                 // })

            //                 // peerConnection.ontrack = (event) => {
            //                 //     event.streams[0].getTracks().forEach(track => {
            //                 //         remoteStream.addTrack(track);
            //                 //     });
            //                 // };

            //                 // peerConnection.onconnectionstatechange = (event) => {
            //                 //     switch (peerConnection.connectionState) {
            //                 //         case "disconnected":
            //                 //             remoteStream.getTracks().forEach((track) => {
            //                 //                 track.stop();
            //                 //             })
            //                 //             break;
            //                 //         case "failed":
            //                 //             remoteStream.getTracks().forEach((track) => {
            //                 //                 console.log(remoteStream);
            //                 //                 remoteStream.removeTrack(track);
            //                 //             })
            //                 //             break;

            //                 //         default:
            //                 //             break;
            //                 //     }
            //                 // }
            //             }
            //         })
            //     });
            // })

        return (async () => {
            if (unsubscribeMembers) {
                await unsubscribeMembers();
            }
            if (unsubscribeConnections) {
                await unsubscribeConnections();
            }
        })

    }, [roomRef]);
    useEffect(() => {
        setRoomJoined();
        return;
    }, [userRef]);

    // useEffect(() => {
    //     if (localStream) document.querySelector('video#localVideo').srcObject = localStream;
    // }, [localStream]);

    // useEffect(() => {
    //     console.log("thay doi remote" + remoteStream.getTracks().length);
    //     if (remoteStream.getTracks().length) document.querySelector('video#remoteVideo').srcObject = remoteStream;
    // }, [remoteStream]);

    const addTrackToPeer = (stream, peer) => {
        stream.getTracks().forEach(track => {
            peer.addTrack(track, stream);
        });
    }

    const createRoom = async () => {
        const userStream = (await navigator.mediaDevices.getUserMedia(constraints));
        setLocalStream(await navigator.mediaDevices.getUserMedia(constraints));
        //tạo phòng trên database
        const roomRef = database.collection("rooms").doc();
        const messagesRef = roomRef.collection('messages');
        setMessagesRef(messagesRef);
        setQuery(messagesRef.orderBy('createdAt').limit(25));

        setRoom(roomRef.id);
        //tạo mới member
        const localMemberRef = await roomRef.collection('members').doc();
        await localMemberRef.set(
            {
                memberID: user.uid,
                memberTimeJoin: new Date(),
            }
        );
        //lấy data member vừa tạo
        let localMember = (await localMemberRef.get()).data();
        //tạo conn khi có người vào phòng
        roomRef.collection('members').onSnapshot((doc) => {
            doc.docChanges().forEach(async (change) => {
                let memberChange = change.doc.data();
                if (change.type === 'added') {
                    let existsPeerConnection = await roomRef.collection('peerConnections')
                        .where('memberOfferID', '==', localMember.memberID)
                        .where('memberAnswerID', '==', memberChange.memberID)
                        .get();
                    if (localMember.memberTimeJoin - memberChange.memberTimeJoin < 0) {
                        console.log(memberChange.memberID);
                        roomRef.collection('peerConnections').doc().set(
                            {
                                memberOfferID: localMember.memberID,
                                memberAnswerID: memberChange.memberID
                            }
                        );
                    }
                }
            })
        });


        //tạo peer2peer khi nó connect mới
        roomRef.collection('peerConnections').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach(async (connectionRef) => {
                let connectionData = connectionRef.doc.data();
                //đọc thông tin connect cần tạo
                if (connectionRef.type === 'added' && connectionData.memberOfferID == user.uid) {
                    console.log("add peerConnections");

                    let tempConnections = localConnections;
                    tempConnections.push(connectionData);
                    setLocalConnections(tempConnections);

                    const peerConnection = new RTCPeerConnection(configuration);
                    const remoteStream = new MediaStream();
                    document.querySelector('video#remoteVideo').srcObject = remoteStream;
                    userStream.getTracks().forEach(track => {
                        peerConnection.addTrack(track, userStream);
                    });

                    peerConnection.onicecandidate = (event) => {
                        if (!event.candidate) {
                            console.log("Got Final Candidate!");
                            return;
                        }
                        console.log('Got candidate: ', event.candidate);
                        connectionRef.doc.ref.collection("callerCandidates").add(event.candidate.toJSON());
                    }

                    const offer = await peerConnection.createOffer();
                    const roomWithOffer = {
                        offer: {
                            type: offer.type,
                            sdp: offer.sdp
                        }
                    }
                    //đặt localdescription
                    await peerConnection.setLocalDescription(offer);

                    //cập nhật lại room
                    await connectionRef.doc.ref.update(roomWithOffer);

                    connectionRef.doc.ref.onSnapshot(async doc => {
                        const data = doc.data();
                        if (!peerConnection.currentRemoteDescription && data && data.answer) {
                            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                        }
                    });

                    connectionRef.doc.ref.collection('calleeCandidates').onSnapshot(doc => {
                        doc.docChanges().forEach(async change => {
                            if (change.type === 'added') {
                                console.log("addIceCandidate");
                                try {
                                    await peerConnection.addIceCandidate(change.doc.data());
                                } catch (error) {
                                    console.log(error);
                                }

                            }
                        });
                    });

                    peerConnection.ontrack = (event) => {
                        event.streams[0].getTracks().forEach(track => {
                            remoteStream.addTrack(track);
                        });
                    };

                    peerConnection.onconnectionstatechange = (event) => {
                        switch (peerConnection.connectionState) {
                            case "disconnected":
                                remoteStream.getTracks().forEach((track) => {
                                    track.stop();
                                })
                                break;
                            case "failed":
                                remoteStream.getTracks().forEach((track) => {
                                    console.log(remoteStream);
                                    remoteStream.removeTrack(track);
                                })
                                break;

                            default:
                                break;
                        }
                    }
                }
            })
        });
    };
    const joinRoom = async (roomId) => {
        const userStream = (await navigator.mediaDevices.getUserMedia(constraints));
        setLocalStream(userStream);
        const roomRef = database.collection('rooms').doc(roomId);
        setRoom(roomRef.id);

        const messagesRef = roomRef.collection('messages');
        setMessagesRef(messagesRef);
        setQuery(messagesRef.orderBy('createdAt').limit(25));

        const localMemberRef = await roomRef.collection('members').doc()
        await localMemberRef.set(
            {
                memberID: user.uid,
                memberTimeJoin: new Date(),
            }
        );

        let localMember = (await localMemberRef.get()).data();

        //tạo conn khi có người vào phòng
        roomRef.collection('members').onSnapshot((doc) => {
            doc.docChanges().forEach(async (change) => {
                let memberChange = change.doc.data();
                if (change.type === 'added') {
                    let existsPeerConnection = await roomRef.collection('peerConnections')
                        .where('memberOfferID', '==', localMember.memberID)
                        .where('memberAnswerID', '==', memberChange.memberID)
                        .get();
                    if (localMember.memberTimeJoin - memberChange.memberTimeJoin < 0) {
                        console.log(memberChange.memberID);
                        roomRef.collection('peerConnections').doc().set(
                            {
                                memberOfferID: localMember.memberID,
                                memberAnswerID: memberChange.memberID
                            }
                        );
                    }
                }
            })
        });

        roomRef.collection('peerConnections').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach(async (connectionRef) => {
                let connectionData = connectionRef.doc.data();
                if (connectionRef.type === 'added' && connectionData.memberAnswerID == user.uid) {
                    console.log("add peerConnections");

                    let tempConnections = localConnections;
                    tempConnections.push(connectionData);
                    setLocalConnections(tempConnections);

                    const peerConnection = new RTCPeerConnection(configuration);
                    const remoteStream = new MediaStream();
                    document.querySelector('video#remoteVideo').srcObject = remoteStream;

                    userStream.getTracks().forEach(track => {
                        peerConnection.addTrack(track, userStream);
                    });

                    peerConnection.onicecandidate = (event) => {
                        if (!event.candidate) {
                            console.log("Got Final Candidate!");
                            return;
                        }
                        console.log('Got candidate: ', event.candidate);
                        connectionRef.doc.ref.collection("calleeCandidates").add(event.candidate.toJSON());
                    }

                    connectionRef.doc.ref.onSnapshot(async (doc) => {
                        console.log("connectionRef CHANGE")
                        if (!doc.data().answer && doc.data().offer) {
                            const offer = doc.data().offer;
                            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                            const answer = await peerConnection.createAnswer();
                            await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

                            const roomWithAnswer = {
                                answer: {
                                    type: answer.type,
                                    sdp: answer.sdp,
                                },
                            };
                            await doc.ref.update(roomWithAnswer);

                            connectionRef.doc.ref.collection('callerCandidates').onSnapshot(snapshot => {
                                snapshot.docChanges().forEach(async changeIceCandidate => {
                                    if (changeIceCandidate.type === 'added') {
                                        console.log("addIceCandidate");
                                        await peerConnection.addIceCandidate(changeIceCandidate.doc.data());
                                    }
                                    console.log("addIceCandidate");
                                });
                            });
                        }
                    })

                    peerConnection.ontrack = (event) => {
                        event.streams[0].getTracks().forEach(track => {
                            remoteStream.addTrack(track);
                        });
                    };

                    peerConnection.onconnectionstatechange = (event) => {
                        switch (peerConnection.connectionState) {
                            case "disconnected":
                                remoteStream.getTracks().forEach((track) => {
                                    track.stop();
                                })
                                break;
                            case "failed":
                                remoteStream.getTracks().forEach((track) => {
                                    console.log(remoteStream);
                                    remoteStream.removeTrack(track);
                                })
                                break;

                            default:
                                break;
                        }
                    }
                }
            })
        });
    };

    const handleAddMessage = async (e, message) => {
        e.preventDefault();
        messagesRef.add({
            text: message,
            createdAt: new Date(),
            userid: user.uid,
        });
    }

    return (
        <div className="h-100 w-100">
            {
                userRef && roomRef && (
                    <Row className="row-cols-3 h-100 w-100 overflow-hidden m-0">
                        <Col className="col-2 overflow-hidden h-100 w-100 p-0">
                            <MessageList messages={messages} handleAddMessage={handleAddMessage} user={user} />
                        </Col>
                        <Col className="col-8 h-100 w-100 p-0">
                            <VideoCall localStream={localStream} />
                        </Col>
                        <Col className="col-2 h-100 w-100 p-0">
                            <RoomInfo user={user} roomid={roomRef.id} setOffMembers={setOffMembers} />
                        </Col>
                    </Row>
                )
            }
        </div>

    );
}

export default Room;