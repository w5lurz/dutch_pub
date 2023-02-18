import { FormEvent, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Socket } from 'socket.io-client';
import { RootState } from '../app/store';
import { TRoom, TRooms } from '../app/types';
import { SocketContext } from './useApp';

export default function useRooms() {
    const socket: Socket = useContext(SocketContext)!;
    const user = useSelector((state: RootState) => state.user);
    const [rooms, setRooms] = useState<TRooms>({});

    const roomsListedListener = (roomsListed: TRooms) => {
        console.log('ROOMS LISTED');
        setRooms(roomsListed);
    };

    const joinedRoomListener = (roomsListed: TRooms) => {
        console.log('JOINED ROOM');
        setRooms(roomsListed);
    };

    const leftRoomListener = (roomsListed: TRooms) => {
        console.log('LEFT ROOM');
        setRooms(roomsListed);
    };

    const deletedRoomListener = (roomsListed: TRooms) => {
        console.log('DELETED ROOM');
        setRooms(roomsListed);
    };

    socket.on('rooms-listed', roomsListedListener);
    socket.on('joined-room', joinedRoomListener);
    socket.on('left-room', leftRoomListener);
    socket.on('room-deleted', deletedRoomListener);

    useEffect(() => {
        socket.emit('list-rooms');
        // socket.on('rooms-listed', roomsListedListener);
    }, []);

    const handleDeleteRoom = (roomId: number) => {
        socket.emit('delete-room', roomId);
    };

    const handleJoinRoom = (username: string, roomId: number) => {
        console.log('JOIN ROOM', username, roomId);
        socket.emit('join-room', { username, roomId });
    };

    const handleLeaveRoom = (username: string, roomId: number) => {
        console.log('JOIN ROOM', username, roomId);
        socket.emit('leave-room', { username, roomId });
    };

    const isInAnyRoom = Object.values(rooms).some((room: TRoom) => room.players.includes(user?.username || 'NO USERNAME'));
    const currentRoom = Object.values(rooms).find((room: TRoom) => room.players.includes(user?.username || 'NO USERNAME'));
    const isAlreadyOwner = Object.values(rooms).find((room: TRoom) => room.owner === user?.username);

    return {
        rooms,
        user,
        isInAnyRoom,
        currentRoom,
        isAlreadyOwner,
        handleDeleteRoom,
        handleJoinRoom,
        handleLeaveRoom,
    };
}
