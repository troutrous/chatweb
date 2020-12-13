import React, { useState } from 'react'

import { Alert, Button, Container, Col, Row, Image, Form } from 'react-bootstrap';

const RoomListItem = props => {
    const { room } = props;
    const { handleJoinRoom } = props;
    return (
        <div type="button" className="list-group-item list-group-item-action list-group-item-light d-flex justify-content-between">
            <div>
                <h6>Tên phòng: {room.roomName}</h6>
                <p className="small mb-1">Mã phòng: {room.id}</p>
                <p className="small mb-1">Số người tham gia: 10</p>
                <p className="small mb-1">Người tạo: {room.roomUserCreated.email}</p>
                <p className="small mb-1">Ngày tạo: {room.roomCreatedAt.toDate().toDateString()}</p>
            </div>
            <div>
                <Button type="button" variant="info" onClick={() => handleJoinRoom(room.id)}>Vào phòng</Button>
            </div>
        </div>
    )
}

export default RoomListItem;