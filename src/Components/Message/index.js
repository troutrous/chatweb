import React from 'react';
import './Message.css';

export default function Message(props) {
  const { message } = props;
  const isMine = true;
  const {user} = props;
  return (
    <div className={[
      'message',
      `${message.userID == user.uid ? 'mine' : ''}`
    ].join(' ')}>
      <div className="bubble-container">
        <div className="bubble">
          <h6>{message.messageText}</h6>
          <small>{message.userName}</small>
        </div>
      </div>
    </div>
  );
}