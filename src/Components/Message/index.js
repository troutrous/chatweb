import React from 'react';
import moment from 'moment';
import './Message.css';

export default function Message(props) {
  const { message } = props;
  const isMine = true;
  const {user} = props;
  return (
    <div className={[
      'message',
      `${message.userid == user.uid ? 'mine' : ''}`
    ].join(' ')}>
      <div className="bubble-container">
        <div className="bubble">
          {message.text}
        </div>
      </div>
    </div>
  );
}