import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Container, Form, Col, Row } from 'react-bootstrap';
import MessageList from '../Components/MessageList';
import 'bootstrap/dist/css/bootstrap.min.css';
import RoomInfo from '../Components/RoomInfo';
import VideoCall from '../Components/VideoCall';
import { useHistory } from 'react-router-dom';
import { app, database, newTimestamp, nowTimestamp } from '../firebase';
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

    const [roomRef, setRoomRef] = useState();
    const [userRef, setUserRef] = useState();

    const [localStream, setLocalStream] = useState();
    const [remoteStreams, setRemoteStreams] = useState([]);

    const [query, setQuery] = useState(null);
    const [messagesRef, setMessagesRef] = useState(null);
    const [query1, setQuery1] = useState(null);
    const [membersRef, setMembersRef] = useState(null);

    const [peerConnections, setPeerConnections] = useState([]);

    const [messages] = useCollectionData(query, { idField: 'id' });
    const [members] = useCollectionData(query1, { idField: 'id' });


    const history = useHistory();
    const handleGotoSign = useCallback(() => history.replace('/sign'), [history]);

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
        let tempLocalStream;
        let erorFlag = false;
        if (!userToken) { handleGotoSign(); return; }
        getCurrentToken()
            .then((token) => {
                setCookie('userToken', token);
                setUser(app.auth().currentUser);
                return roomCollectionRef.doc(roomIDParam).get();
            })
            .then((roomExists) => {
                if (roomExists.exists) {
                    return navigator.mediaDevices.getUserMedia(constraints);
                } else {
                    alert("Phòng không hợp lệ");
                    handleGotoSign();
                    erorFlag = true;
                    throw new Error("No room");
                }
            })
            .then((stream) => {
                console.log("add localStream");
                tempLocalStream = stream;
                setLocalStream(stream);
            })
            .catch((err) => {
                console.log(err.message);
            })
            .finally(() => {
                if (!erorFlag) {
                    console.log("hahaha");
                    setUserRef(userCollectionRef.doc(app.auth().currentUser.uid));
                    setRoomRef(roomCollectionRef.doc(roomIDParam));
                    setQuery(roomCollectionRef.doc(roomIDParam).collection('messages').orderBy('createdAt', 'asc'));
                    setMessagesRef(roomCollectionRef.doc(roomIDParam).collection('messages'));
                    setQuery1(roomCollectionRef.doc(roomIDParam).collection('members').orderBy('memberTimeJoin', 'asc'));
                    setMembersRef(roomCollectionRef.doc(roomIDParam).collection('members'));
                }
            })
        return () => {
            if (tempLocalStream) {
                tempLocalStream.getTracks().forEach(function (track) {
                    track.stop();
                });
            }
        };
    }, []);

    const closeConnections = () => {
        peerConnections.forEach(connection => {
            connection.close();
        })
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
                joinedAt: newTimestamp
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
        let unsubscribeConnection = null;
        let unsubscribeCalleeCandidates = null;
        let unsubscribeCallerCandidates = null;
        membersRef.where('memberID', '==', user.uid).get()
            .then((membersSnapshotPromise) => {
                membersSnapshot = membersSnapshotPromise;
            })
            .then(() => {
                console.log("step1");
                if (!membersSnapshot.empty) {
                    membersSnapshot.forEach(async memberSnap => {
                        localMemberRef = membersRef.doc(memberSnap.id);
                        return localMemberRef.update({
                            memberStatus: true,
                            memberTimeJoin: newTimestamp
                        })
                    });
                } else {
                    localMemberRef = membersRef.doc();
                    return localMemberRef.set({
                        memberID: user.uid,
                        memberTimeJoin: newTimestamp,
                        memberStatus: true,
                        memberEmail: user.email
                    });
                }
            })
            .then(() => {
                console.log("step2");
                unsubscribeMembers = roomRef.collection('members').onSnapshot(async (doc) => {
                    localMember = (await localMemberRef.get()).data();
                    doc.docChanges().forEach(async (change) => {
                        const memberChange = change.doc.data();
                        if (localMember.memberTimeJoin - memberChange.memberTimeJoin < 0 && memberChange.memberStatus == true && localMember.memberID != memberChange.memberID) {
                            console.log("create", memberChange.memberID);
                            return roomRef.collection('peerConnections').doc().set(
                                {
                                    memberOfferID: localMember.memberID,
                                    memberAnswerID: memberChange.memberID,
                                    connectedAt: newTimestamp,
                                }
                            );
                        }
                    })
                });
            })
            .then(() => {
                console.log("step3");
                unsubscribeConnections = roomRef.collection('peerConnections').onSnapshot((snapshot) => {
                    snapshot.docChanges().forEach(async (connectionRef) => {
                        let connectionData = connectionRef.doc.data();
                        localMember = (await localMemberRef.get()).data();
                        let offerOptions;

                        if (connectionRef.type === 'modified' && connectionData.memberOfferID == user.uid && connectionData.offer == undefined && localMember.memberTimeJoin - connectionData.connectedAt < 0) {
                            console.log("peer offer", connectionData.memberAnswerID);
                            const peerConnection = new RTCPeerConnection(configuration);
                            setPeerConnections((peerConnections) => [...peerConnections, peerConnection]);
                            const remoteStream = new MediaStream();

                            if (localStream) {
                                // console.log("add localStream");
                                localStream.getTracks().forEach(track => {
                                    peerConnection.addTrack(track, localStream);
                                });
                                offerOptions = {};
                            }
                            else {
                                offerOptions = {
                                    offerToReceiveAudio: true,
                                    offerToReceiveVideo: true
                                }
                            }

                            peerConnection.onicecandidate = (event) => {
                                if (!event.candidate) {
                                    // console.log("Got Final Candidate!");
                                    return;
                                }
                                // console.log('Got candidate');
                                connectionRef.doc.ref.collection("callerCandidates").add(event.candidate.toJSON());
                            }
                            // console.log("create offer");

                            const offer = await peerConnection.createOffer(offerOptions);
                            const roomWithOffer = {
                                offer: {
                                    type: offer.type,
                                    sdp: offer.sdp
                                }
                            }
                            // đặt localdescription
                            // console.log('setLocalDescription');
                            await peerConnection.setLocalDescription(offer);

                            // cập nhật lại room
                            await connectionRef.doc.ref.update(roomWithOffer);

                            connectionRef.doc.ref.onSnapshot(async doc => {
                                const data = doc.data();
                                if (!peerConnection.currentRemoteDescription && data && data.answer) {
                                    // console.log('setRemoteDescription');
                                    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                                }
                                if (data.isClosed == true) {
                                    console.log('tat connection');
                                }
                            });

                            connectionRef.doc.ref.collection('calleeCandidates').onSnapshot(doc => {
                                doc.docChanges().forEach(async change => {
                                    if (change.type === 'added') {
                                        // console.log("addIceCandidate");
                                        try {
                                            await peerConnection.addIceCandidate(change.doc.data());
                                        } catch (error) {
                                            console.log(error);
                                        }
                                    }
                                });
                            });

                            let saveStreamID = null;
                            peerConnection.ontrack = (event) => {
                                event.streams[0].getTracks().forEach(track => {
                                    remoteStream.addTrack(track);
                                });
                                console.log("receive stream", event.streams[0].id);
                                if (!saveStreamID) {
                                    saveStreamID = event.streams[0].id;
                                    console.log("add stream", remoteStream.id)
                                    setRemoteStreams((remoteStreams) => [...remoteStreams, remoteStream]);
                                } else {
                                    console.log("modified stream", remoteStream.id)
                                    setRemoteStreams((remoteStreams) => {
                                        let copyStreams = [...remoteStreams];
                                        copyStreams[remoteStreams.findIndex(({ id }) => id === remoteStream.id)] = remoteStream;
                                        return copyStreams;
                                    });
                                }
                            };

                            peerConnection.onconnectionstatechange = (event) => {
                                switch (peerConnection.connectionState) {
                                    case "disconnected":
                                        console.log("disconnected");
                                        remoteStream.getTracks().forEach((track) => {
                                            track.stop();
                                        })
                                        break;
                                    case "failed":
                                        console.log("failed");
                                        remoteStream.getTracks().forEach((track) => {
                                            remoteStream.removeTrack(track);
                                            setRemoteStreams((remoteStreams) => {
                                                return remoteStreams.filter((streamItem) =>
                                                    streamItem.id != remoteStream.id
                                                );
                                            }
                                            );
                                        })
                                        break;
                                    case "closed":
                                        console.log("closed");
                                        break;
                                    default:
                                        break;
                                }
                            }


                        }
                        if (connectionRef.type === 'added' && connectionData.memberAnswerID == user.uid && connectionData.answer == undefined && localMember.memberTimeJoin - connectionData.connectedAt < 0) {
                            console.log("peer answer", connectionData.memberOfferID);
                            const peerConnection = new RTCPeerConnection(configuration);
                            setPeerConnections((peerConnections) => [...peerConnections, peerConnection]);
                            const remoteStream = new MediaStream();

                            if (localStream) {
                                // console.log("add localStream");
                                localStream.getTracks().forEach(track => {
                                    peerConnection.addTrack(track, localStream);
                                });
                            }

                            peerConnection.onicecandidate = (event) => {
                                if (!event.candidate) {
                                    // console.log("Got Final Candidate!");
                                    return;
                                }
                                // console.log('Got candidate');
                                connectionRef.doc.ref.collection("calleeCandidates").add(event.candidate.toJSON());
                            }

                            connectionRef.doc.ref.onSnapshot(async (doc) => {
                                const data = doc.data();
                                if (!data.answer && data.offer) {
                                    const offer = data.offer;
                                    // console.log("setRemoteDescription");
                                    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                                    const answer = await peerConnection.createAnswer();
                                    // console.log("setLocalDescription");
                                    await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

                                    const roomWithAnswer = {
                                        answer: {
                                            type: answer.type,
                                            sdp: answer.sdp,
                                        },
                                    };
                                    // console.log("create answer");
                                    await doc.ref.update(roomWithAnswer);

                                    connectionRef.doc.ref.collection('callerCandidates').onSnapshot(snapshot => {
                                        snapshot.docChanges().forEach(async changeIceCandidate => {
                                            if (changeIceCandidate.type === 'added') {
                                                // console.log("addIceCandidate");
                                                await peerConnection.addIceCandidate(changeIceCandidate.doc.data());
                                            }
                                            // console.log("addIceCandidate");
                                        });
                                    });
                                }

                                if (data.isClosed == true) {
                                    console.log('tat connection');
                                }
                            });

                            let saveStreamID = null;
                            peerConnection.ontrack = (event) => {
                                event.streams[0].getTracks().forEach(track => {
                                    remoteStream.addTrack(track);
                                });
                                console.log("receive stream", event.streams[0].id);
                                if (!saveStreamID) {
                                    saveStreamID = event.streams[0].id;
                                    console.log("add stream", remoteStream.id)
                                    setRemoteStreams((remoteStreams) => [...remoteStreams, remoteStream]);
                                } else {
                                    console.log("modified stream", remoteStream.id)
                                    setRemoteStreams((remoteStreams) => {
                                        let copyStreams = [...remoteStreams];
                                        copyStreams[remoteStreams.findIndex(({ id }) => id === remoteStream.id)] = remoteStream;
                                        return copyStreams;
                                    });
                                }
                            };

                            peerConnection.onconnectionstatechange = (event) => {
                                switch (peerConnection.connectionState) {
                                    case "disconnected":
                                        console.log("disconnected");
                                        remoteStream.getTracks().forEach((track) => {
                                            track.stop();
                                        })
                                        break;
                                    case "failed":
                                        console.log("failed");
                                        remoteStream.getTracks().forEach((track) => {
                                            remoteStream.removeTrack(track);
                                            setRemoteStreams((remoteStreams) => {
                                                return remoteStreams.filter((streamItem) =>
                                                    streamItem.id != remoteStream.id
                                                );
                                            }
                                            );
                                        })
                                        break;
                                    case "closed":
                                        console.log("closed");
                                        break;
                                    default:
                                        break;
                                }
                            }


                        }
                    })
                });
            })
            .catch((err) =>
                console.log(err.message)
            )


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

    const handleAddMessage = async (e, message) => {
        e.preventDefault();
        if (message) {
            messagesRef.add({
                text: message,
                createdAt: newTimestamp,
                userid: user.uid,
            });
        }
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
                            <VideoCall localStream={localStream} remoteStreams={remoteStreams} />
                        </Col>
                        <Col className="col-2 h-100 w-100 p-0">
                            <RoomInfo user={user} roomid={roomRef.id} members={members} setOffMembers={setOffMembers} closeConnections={closeConnections} />
                        </Col>
                    </Row>
                )
            }
        </div>

    );
}

export default Room;