import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Container, Form, Col, Row } from 'react-bootstrap';

const Profile = (props) => {
    return (
        <Row className="row-cols-3 h-100 w-100 overflow-hidden m-0">
            <Col className="col-4 p-0">
                
            </Col>
            <Col className="col-8 p-0 bg-light">
            <div class="list-group">
                    <div type="button" class="list-group-item list-group-item-action list-group-item-light d-flex justify-content-between">
                        <div>
                            <h6>Tên phòng: abcdxyz</h6>
                            <p className="small mb-1">Mã phòng: kjsabdkajbdkjb</p>
                            <p className="small mb-1">Số người tham gia: 10</p>
                        </div>
                        <div>
                            <Button variant="info">Vào phòng</Button>
                        </div>
                    </div>
                    <div type="button" class="list-group-item list-group-item-action list-group-item-light d-flex justify-content-between">
                        <div>
                            <h6>Tên phòng: abcdxyz</h6>
                            <p className="small mb-1">Mã phòng: kjsabdkajbdkjb</p>
                            <p className="small mb-1">Số người tham gia: 10</p>
                        </div>
                        <div>
                            <Button variant="info">Vào phòng</Button>
                        </div>
                    </div>
                    <div type="button" class="list-group-item list-group-item-action list-group-item-light d-flex justify-content-between">
                        <div>
                            <h6>Tên phòng: abcdxyz</h6>
                            <p className="small mb-1">Mã phòng: kjsabdkajbdkjb</p>
                            <p className="small mb-1">Số người tham gia: 10</p>
                        </div>
                        <div>
                            <Button variant="info">Vào phòng</Button>
                        </div>
                    </div>
                    <div type="button" class="list-group-item list-group-item-action list-group-item-light d-flex justify-content-between">
                        <div>
                            <h6>Tên phòng: abcdxyz</h6>
                            <p className="small mb-1">Mã phòng: kjsabdkajbdkjb</p>
                            <p className="small mb-1">Số người tham gia: 10</p>
                        </div>
                        <div>
                            <Button variant="info">Vào phòng</Button>
                        </div>
                    </div>
                </div>
            </Col>
        </Row>
    );
}

export default Profile