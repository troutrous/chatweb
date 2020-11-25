import React, { useEffect, useState } from 'react';
import './VideoCall.css';
import { Alert, Button, Container, Form, Col, Row } from 'react-bootstrap';
import firebase from '../../firebase';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import 'firebase/firestore';

// tạo biến database
const db = firebase.firestore();

// lấy doc bảng room trong firebase
// // Updates the select element with the provided set of cameras
// function updateCameraList(cameras) {
//     const listElement = document.querySelector('select#availableCameras');
//     listElement.innerHTML = '';
//     cameras.map(camera => {
//         const cameraOption = document.createElement('option');
//         cameraOption.label = camera.label;
//         cameraOption.value = camera.deviceId;
//     }).forEach(cameraOption => listElement.add(cameraOption));
// }

// // Fetch an array of devices of a certain type
// async function getConnectedDevices(type) {
//     const devices = await navigator.mediaDevices.enumerateDevices();
//     return devices.filter(device => device.kind === type)
// }

// // Get the initial set of cameras connected
// const videoCameras = getConnectedDevices('videoinput');
// updateCameraList(videoCameras);

// // Listen for changes to media devices and update the list accordingly
// navigator.mediaDevices.addEventListener('devicechange', event => {
//     const newCameraList = getConnectedDevices('video');
//     updateCameraList(newCameraList);
// });

// Open camera with at least minWidth and minHeight capabilities
// async function openCamera(cameraId, minWidth, minHeight) {
//     const constraints = {
//         'audio': { 'echoCancellation': true },
//         'video': {
//             'deviceId': cameraId,
//             'width': { 'min': minWidth },
//             'height': { 'min': minHeight }
//         }
//     }

//     return await navigator.mediaDevices.getUserMedia(constraints);
// }

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

const remoteStream = new MediaStream();
export default function VideoCall(props) {
    const [stream, setStream] = useState(null);
    useEffect(() => {

    }, []);

    async function playVideoFromCamera() {

    }

    const createRoom = async () => {

        // try {
        const constraints = {
            'audio': { 'echoCancellation': true },
            'video': {
                'width': 320,
                'height': 240,
                cursor: 'always' | 'motion' | 'never',
                displaySurface: 'application' | 'browser' | 'monitor' | 'window'
            }
        }
        const localStream = await navigator.mediaDevices.getUserMedia(constraints);


        document.querySelector('video#localVideo').srcObject = localStream;
        document.querySelector('video#remoteVideo').srcObject = remoteStream;
        // } catch (error) {
        //     console.error('Error opening video camera.', error);
        // }
        //config cho stun server trả về ip public của client
        //tạo kết nối peer to peer
        const peerConnection = new RTCPeerConnection(configuration);
        // thêm các track âm thanh, hình ảnh của stream vào peer
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        //tạo mới bản ghi trên cloud -> trả về id phòng
        const roomRef = db.collection("rooms").doc();
        console.log("Room id: " + roomRef.id);

        // thêm các icecandidate vào collection người gọi trên cloud
        peerConnection.onicecandidate = (event) => {
            if (!event.candidate) {
                console.log("Got Final Candidate!");
                return;
            }
            console.log('Got candidate: ', event.candidate);
            roomRef.collection("callerCandidates").add(event.candidate.toJSON());
        }
        //tạo offer


        const offer = await peerConnection.createOffer();
        const roomWithOffer = {
            offer: {
                type: offer.type,
                sdp: offer.sdp
            }
        }
        //cập nhật lại room
        await roomRef.set(roomWithOffer);
        //đặt localdescription
        await peerConnection.setLocalDescription(offer);


        //view các track khách
        peerConnection.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => {
                remoteStream.addTrack(track);
            });
        }

        //lắng nghe thay đổi thông tin callee
        roomRef.collection('calleeCandidates').onSnapshot(doc => {
            doc.docChanges().forEach(async change => {
                if (change.type === 'added') {
                    console.log("add icecandidate");
                    await peerConnection.addIceCandidate(change.doc.data());
                }
            });
        });

        //lắng nghe answer
        roomRef.onSnapshot(async doc => {
            const data = doc.data();
            if (data && data.answer) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
        });
        

    };

    const joinRoom = async () => {
        const constraints = {
            'audio': { 'echoCancellation': true },
            'video': {
                'width': 640,
                'height': 480,
                cursor: 'always' | 'motion' | 'never',
                displaySurface: 'application' | 'browser' | 'monitor' | 'window'
            }
        }
        const localStream = await navigator.mediaDevices.getUserMedia(constraints);
        document.querySelector('video#localVideo').srcObject = localStream;
        document.querySelector('video#remoteVideo').srcObject = remoteStream;
        //lấy giá trị phòng

        const roomId = document.querySelector('#roomID').value;
        const roomRef = db.collection('rooms').doc(roomId);

        const roomSnapshot = await roomRef.get();

        if (roomSnapshot.exists) {
            const peerConnection = new RTCPeerConnection(configuration);
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });

            peerConnection.onicecandidate = (event) => {
                if (!event.candidate) {
                    console.log('Got final candidate!');
                    return;
                }
                console.log('Got candidate: ', event.candidate);
                roomRef.collection('calleeCandidates').add(event.candidate.toJSON());
            };
            peerConnection.ontrack = (event) => {
                console.log('Got remote track:', event.streams[0]);
                event.streams[0].getTracks().forEach(track => {
                    console.log('Add a track to the remoteStream:', track);
                    remoteStream.addTrack(track);
                });
            }

            const offer = roomSnapshot.data().offer;
            await peerConnection.setRemoteDescription(offer);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            const roomWithAnswer = {
                answer: {
                    type: answer.type,
                    sdp: answer.sdp,
                },
            };
            await roomRef.update(roomWithAnswer);

            // Code for creating SDP answer above

            // Listening for remote ICE candidates below
            roomRef.collection('callerCandidates').onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        await peerConnection.addIceCandidate(change.doc.data());
                    }
                });
            });

            // Listening for remote ICE candidates above
        }
    };
    return (
        <div className="videoCallContainer">
            <Button variant="outline-primary" type="button" className="btn" onClick={createRoom}>
                Create
            </Button>
            <Form.Control type="text" placeholder="Id room" id="roomID" />
            <Button variant="outline-primary" type="button" className="btn" onClick={joinRoom}>
                Join
            </Button>
            <video id="localVideo" className="bg-dark" autoPlay playsInline controls={false} />
            <video id="remoteVideo" className="bg-dark" autoPlay playsInline controls={false} />
        </div>
    );
}