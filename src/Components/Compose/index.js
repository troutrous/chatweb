import React from 'react';
import './Compose.css';

export default function Compose(props) {
    return (
      <div className="compose">
        <input
          type="text"
          className="compose-input px-2"
          placeholder="Type a message, @name"
        />
        {/* {
          props.rightItems
        } */}
      </div>
    );
}