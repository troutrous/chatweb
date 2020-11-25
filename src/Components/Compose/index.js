import React, { useState } from 'react';
import './Compose.css';
import { Button } from 'react-bootstrap';

import firebase from '../../firebase';
import 'firebase/firestore';

const db = firebase.firestore();
const messagesRef = db.collection('messages');

export default function Compose(props) {
  const [message, setMessage] = useState('')
  const handleSendMessage = async (e) => {
    e.preventDefault();
    messagesRef.add({
      text: message,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
  }
  return (
    <div className="compose w-100">
      <form className="w-100">
        <div className="form-group m-0 d-flex align-items-center" >
          <input type="text" className="compose-input border-0 outline-0 pl-2" placeholder="Something" onChange={(e) => setMessage(e.target.value)} value={message} />
          <Button variant="outline-none" type="button compose-button" className="btn" onClick={(e) => handleSendMessage(e)}>
            <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-cursor d-flex" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103zM2.25 8.184l3.897 1.67a.5.5 0 0 1 .262.263l1.67 3.897L12.743 3.52 2.25 8.184z" />
            </svg>
          </Button>
        </div>
      </form>

    </div>
  );
}