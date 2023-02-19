import { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { RootState } from '../app/store';
import { TRoom, TRooms, User } from '../app/types';
import { setUser } from '../app/userSlice';
import { SocketContext } from './useApp';

export default function useRooms() {
    const socket: Socket = useContext(SocketContext)!;
    // TODO move to store
    const [rooms, setRooms] = useState<TRooms>({});

    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.user);
    let navigate = useNavigate();

    useEffect(() => {
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

        const gameStartedListener = (roomsListed: TRooms, game: any) => {
            console.log('Game started', roomsListed, game);
            navigate('/game');
            setRooms(roomsListed);
            dispatch(setUser({ ...user, inGame: true } as User));
        };

        socket.emit('list-rooms');
        socket.on('rooms-listed', roomsListedListener);
        socket.on('joined-room', joinedRoomListener);
        socket.on('left-room', leftRoomListener);
        socket.on('room-deleted', deletedRoomListener);
        socket.on('game-started', gameStartedListener);
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

    const handleStartRoom = (roomId: number) => {
        socket.emit('start-game', roomId);
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
        handleStartRoom,
    };
}
