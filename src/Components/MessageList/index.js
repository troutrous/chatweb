import React, { useEffect, useState } from 'react';
import Compose from '../Compose';
// import Toolbar from '../Toolbar';
import ToolbarButton from '../ToolbarButton';
import Message from '../Message';
import moment from 'moment';
import {database} from '../../firebase';
import 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';

import './MessageList.css';

const messagesRef = database.collection('messages');

export default function MessageList(props) {
  
  const query = messagesRef.orderBy('createdAt').limit(25);
  const [messages] = useCollectionData(query, { idField: 'id' });

  return (
    <div className="message-list h-100 w-100">

      <div className="message-list-container overflow-auto">
        {
          messages && messages.map(message => {
            return (
              <Message key={message.id} message={message} />
            )
          })
        }
      </div>
      <Compose/>
    </div>
  );
}