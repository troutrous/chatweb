import React from 'react';
import moment from 'moment';
import './Message.css';

export default function Message(props) {
  const { message } = props;

  const isMine = true;
  const startsSequence = false;
  const endsSequence = false;
  return (
    <div className={[
      'message',
      `${isMine ? 'mine' : ''}`,
      `${startsSequence ? 'start' : ''}`,
      `${endsSequence ? 'end' : ''}`
    ].join(' ')}>
      <div className="bubble-container">
        <div className="bubble">
          {message.text}
        </div>
      </div>
    </div>
  );
}