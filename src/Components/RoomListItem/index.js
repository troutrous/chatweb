import React, { useState } from 'react'

import { Alert, Button, Container, Col, Row, Image, Form } from 'react-bootstrap';

const RoomListItem = props => {
    const { room } = props;
    const { handleJoinRoom } = props;
    return (
        <Alert type="button" className="list-group-item list-group-item-action list-group-item-info d-flex justify-content-between">
            <div>
                <h6>Tên phòng: {room.roomName}</h6>
                <p className="small mb-1">Mã phòng: {room.id}</p>
                <p className="small mb-1">Số người tham gia: {room.memberArray.length}</p>
                <p className="small mb-1">Số người đang trong phòng: {room.memberArray.filter((item) => item.memberStatus == true).length}</p>
                <p className="small mb-1">Người tạo: {room.roomLead.displayName}</p>
                <p className="small mb-1">Ngày tạo: {room.roomCreatedAt.toDate().toDateString()}</p>
                <p className="small mb-1">Các thành viên: {room.memberArray.reduce((accumulator, currentValue) => accumulator + currentValue.memberEmail + ', ', '')}</p>
            </div>
            <div>
                <Button type="button" variant="info" onClick={() => handleJoinRoom(room.id)}>
                    <span className="mr-2">Vào phòng</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-caret-right" viewBox="0 0 16 16">
                        <path d="M6 12.796V3.204L11.481 8 6 12.796zm.659.753l5.48-4.796a1 1 0 0 0 0-1.506L6.66 2.451C6.011 1.885 5 2.345 5 3.204v9.592a1 1 0 0 0 1.659.753z" />
                    </svg>
                </Button>
            </div>
        </Alert>
    )
}

export default RoomListItem;