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

    const [roomData, setRoomData] = useState();

    const [localStream, setLocalStream] = useState();
    const [remoteStreams, setRemoteStreams] = useState([]);

    const [queryForMessageData, setQueryForMessageData] = useState(null);
    const [messagesRef, setMessagesRef] = useState(null);
    const [queryForMemberData, setQueryForMemberData] = useState(null);
    const [membersRef, setMembersRef] = useState(null);

    const [peerConnections, setPeerConnections] = useState([]);

    const [connections, setConnections] = useState([]);
    const [membersConnect, setMembersConnect] = useState([]);

    const [messages] = useCollectionData(queryForMessageData, { idField: 'id' });
    const [members] = useCollectionData(queryForMemberData, { idField: 'id' });


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
                    while (true) {
                        let password = prompt("Vui lòng nhập mật khẩu để vào phòng");
                        if (password === roomExists.data().roomPassword) {
                            setRoomData(roomExists.data());
                            return roomCollectionRef.doc(roomIDParam).collection('members').where('memberID', '==', app.auth().currentUser.uid).get();
                        }
                        else {
                            var answer = window.confirm("Rất tiêc! Mật khẩu của bạn chưa đúng! Bạn có muốn nhập lại mật khẩu ??");
                            if (answer) {
                            }
                            else {
                                handleGotoSign();
                                erorFlag = true;
                                throw new Error("Password failed");
                            }
                        }
                    }
                } else {
                    alert("Phòng không hợp lệ");
                    handleGotoSign();
                    erorFlag = true;
                    throw new Error("No room");
                }
            })
            .then((members) => {
                members.forEach((member) => {
                    if (member.data().memberBlocked == true) {
                        alert("Rất tiếc! Bạn không thể tham gia phòng này!");
                        handleGotoSign();
                        erorFlag = true;
                        throw new Error("User was blocked");
                    }
                })
                return navigator.mediaDevices.getUserMedia(constraints);
            })
            .then((stream) => {
                tempLocalStream = stream;
                setLocalStream(stream);
            })
            .catch((err) => {
                console.log(err.message);
            })
            .finally(() => {
                if (!erorFlag) {
                    setUserRef(userCollectionRef.doc(app.auth().currentUser.uid));
                    setRoomRef(roomCollectionRef.doc(roomIDParam));

                    setQueryForMessageData(roomCollectionRef.doc(roomIDParam).collection('messages').orderBy('createdAt', 'asc'));
                    setMessagesRef(roomCollectionRef.doc(roomIDParam).collection('messages'));
                    setQueryForMemberData(roomCollectionRef.doc(roomIDParam).collection('members').orderBy('memberTimeJoin', 'asc'));
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
        console.log(peerConnections.length);
        peerConnections.forEach(connection => {
            connection.close();
        })
    }

    const setOffMembers = async () => {
        if (!roomRef || !membersRef) return;
        const membersSnapshot = await membersRef.where('memberID', '==', user.uid).get();
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
        if (!members || !user) return;
        const localMember = members.find(member => member.memberID == user.uid);

        members.forEach(member => {
            if (localMember.memberID != member.memberID &&
                localMember.memberTimeJoin != null &&
                member.memberTimeJoin != null &&
                localMember.memberTimeJoin - member.memberTimeJoin < 0 &&
                localMember.memberStatus === true &&
                member.memberStatus === true &&
                !membersConnect.find(mC => mC.memberID == member.memberID)
            ) {
                console.log("create", localMember, member);
                setMembersConnect((membersConnect) => [...membersConnect, member]);
                return roomRef.collection('peerConnections').doc().set(
                    {
                        memberOfferID: localMember.memberID,
                        memberAnswerID: member.memberID,
                        connectedAt: newTimestamp,
                    }
                );
            }
        })
    }, [members])


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
                        memberEmail: user.email,
                        memberName: user.displayName,
                        memberBlocked: false,
                        memberAdmin: false,
                    });

                }
            })
            .then(() => {
                console.log("step2");
                return membersRef.doc(localMemberRef.id).get();
            })
            .then((localMemberRef) => {
                localMember = localMemberRef.data();
                if (!localMember.memberTimeJoin) {
                    return membersRef.doc(localMemberRef.id).get();
                } else {
                    return localMemberRef;
                }
            })
            .then((localMemberRef) => {
                localMember = localMemberRef.data();
                // unsubscribeMembers = roomRef.collection('members').onSnapshot(async (doc) => {
                //     doc.docChanges().forEach(async (change) => {
                //         console.log(connections);
                //         const memberChange = change.doc.data();
                //         if (localMember.memberTimeJoin != null && localMember.memberTimeJoin - memberChange.memberTimeJoin < 0 && memberChange.memberStatus == true && localMember.memberStatus == true && localMember.memberID != memberChange.memberID) {
                //             console.log("create", memberChange.memberID);
                //             return roomRef.collection('peerConnections').doc().set(
                //                 {
                //                     memberOfferID: localMember.memberID,
                //                     memberAnswerID: memberChange.memberID,
                //                     connectedAt: newTimestamp,
                //                 }
                //             );
                //         }
                //     })
                // });
            })
            .then(() => {
                console.log("step3");
                unsubscribeConnections = roomRef.collection('peerConnections').onSnapshot((snapshot) => {
                    snapshot.docChanges().forEach(async (connectionRef) => {
                        let connectionData = connectionRef.doc.data();
                        localMember = (await localMemberRef.get()).data();
                        let offerOptions;

                        if (connectionRef.type === 'modified' && connectionData.memberOfferID == user.uid && connectionData.offer == undefined && localMember.memberTimeJoin - connectionData.connectedAt < 0 && localMember.memberTimeJoin != null) {
                            console.log("peer offer", connectionData.memberAnswerID);
                            const peerConnection = new RTCPeerConnection(configuration);
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
                                if (!saveStreamID) {
                                    saveStreamID = event.streams[0].id;
                                    setRemoteStreams((remoteStreams) => [...remoteStreams, remoteStream]);
                                } else {
                                    setRemoteStreams((remoteStreams) => {
                                        let copyStreams = [...remoteStreams];
                                        copyStreams[remoteStreams.findIndex(({ id }) => id === remoteStream.id)] = remoteStream;
                                        return copyStreams;
                                    });
                                }
                            };

                            peerConnection.onconnectionstatechange = (event) => {
                                switch (peerConnection.connectionState) {
                                    case "connected":
                                        console.log("connected");
                                        setPeerConnections((peerConnections) => [...peerConnections, peerConnection]);
                                        break;
                                    case "disconnected":
                                        console.log("disconnected");
                                        remoteStream.getTracks().forEach((track) => {
                                            track.stop();
                                        });

                                        break;
                                    case "failed":
                                        remoteStream.getTracks().forEach((track) => {
                                            remoteStream.removeTrack(track);
                                            setRemoteStreams((remoteStreams) => {
                                                return remoteStreams.filter((streamItem) =>
                                                    streamItem.id != remoteStream.id
                                                );
                                            });
                                        });
                                        setMembersConnect((membersConnect) => {
                                            return membersConnect.filter((mC) =>
                                                mC.memberID != connectionData.memberAnswerID
                                            );
                                        });
                                        peerConnection.close();
                                        break;
                                    case "closed":
                                        break;
                                    default:
                                        break;
                                }
                            }


                        }
                        if (connectionRef.type === 'added' && connectionData.memberAnswerID == user.uid && connectionData.answer == undefined && localMember.memberTimeJoin - connectionData.connectedAt < 0) {
                            console.log("peer answer", connectionData.memberOfferID);
                            const peerConnection = new RTCPeerConnection(configuration);

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
                            });

                            let saveStreamID = null;
                            peerConnection.ontrack = (event) => {
                                event.streams[0].getTracks().forEach(track => {
                                    remoteStream.addTrack(track);
                                });
                                if (!saveStreamID) {
                                    saveStreamID = event.streams[0].id;
                                    setRemoteStreams((remoteStreams) => [...remoteStreams, remoteStream]);
                                } else {
                                    setRemoteStreams((remoteStreams) => {
                                        let copyStreams = [...remoteStreams];
                                        copyStreams[remoteStreams.findIndex(({ id }) => id === remoteStream.id)] = remoteStream;
                                        return copyStreams;
                                    });
                                }
                            };

                            peerConnection.onconnectionstatechange = (event) => {
                                switch (peerConnection.connectionState) {
                                    case "connected":
                                        console.log("connected");
                                        setPeerConnections((peerConnections) => [...peerConnections, peerConnection]);
                                        break;
                                    case "disconnected":
                                        console.log("disconnected");
                                        remoteStream.getTracks().forEach((track) => {
                                            track.stop();
                                        });
                                        break;
                                    case "failed":
                                        console.log("failed");
                                        remoteStream.getTracks().forEach((track) => {
                                            remoteStream.removeTrack(track);
                                            setRemoteStreams((remoteStreams) => {
                                                return remoteStreams.filter((streamItem) =>
                                                    streamItem.id != remoteStream.id
                                                );
                                            });
                                        });
                                        setMembersConnect((membersConnect) => {
                                            return membersConnect.filter((mC) =>
                                                mC.memberID != connectionData.memberOfferID
                                            );
                                        });
                                        peerConnection.close();
                                        break;
                                    case "closed":
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
                messageText: message,
                createdAt: newTimestamp,
                userID: user.uid,
                userEmail: user.email,
                userName: user.displayName
            });
        }
    }

    const handleBlockedUser = ({ member = '', type = '' }) => {
        if (type === 'Blocked') {
            membersRef.doc(member.id).update({
                memberBlocked: true
            });
            return;
        }
        if (type === 'Unblocked') {
            membersRef.doc(member.id).update({
                memberBlocked: false
            });
            return;
        }
        if (type === 'Authorize') {
            membersRef.doc(member.id).update({
                memberAdmin: true
            });
            return;
        }
        if (type === 'Unauthorize') {
            membersRef.doc(member.id).update({
                memberAdmin: false
            });
            return;
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
                            <RoomInfo user={user} roomIDParam={roomIDParam} roomData={roomData} members={members} setOffMembers={setOffMembers} closeConnections={closeConnections} handleBlockedUser={handleBlockedUser} />
                        </Col>
                    </Row>
                )
            }
        </div>

    );
}

export default Room;