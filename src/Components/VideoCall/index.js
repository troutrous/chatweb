import React, { useEffect, useState } from 'react';
import './VideoCall.css';
import { Alert, Button, Container, Form, Col, Row } from 'react-bootstrap';
import {app, database} from '../../firebase';
import { useCollectionData } from 'react-firebase-hooks/firestore';


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
export default function VideoCall(props) {
    return (
        <div className="videoCallContainer">
            <video id="localVideo" className="bg-dark r-0" autoPlay playsInline controls={false} />
            <video id="remoteVideo" className="bg-dark" autoPlay playsInline controls={false} />
        </div>
    );
}