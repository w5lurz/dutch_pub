import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { updateGame } from '../app/gameSlice';
import { setToast } from '../app/generalSlice';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setRooms } from '../app/roomsSlice';
import { RootState } from '../app/store';
import { Game, Player, TRoom, TRooms, User } from '../app/types';
import { setInGame } from '../app/userSlice';
import { SocketContext } from './useApp';

export default function useRooms() {
    const socket: Socket = useContext(SocketContext)!;
    let navigate = useNavigate();

    const dispatch = useAppDispatch();
    const rooms = useAppSelector((state: RootState) => state.rooms);
    const user = useAppSelector((state: RootState) => state.user);

    useEffect(() => {
        const roomsListedListener = (roomsListed: TRooms) => {
            console.log('ROOMS LISTED');
            dispatch(setRooms(roomsListed));
        };

        const joinedRoomListener = (roomsListed: TRooms) => {
            console.log('JOINED ROOM');
            dispatch(setRooms(roomsListed));
        };

        const leftRoomListener = (roomsListed: TRooms) => {
            console.log('LEFT ROOM');
            dispatch(setRooms(roomsListed));
        };

        const deletedRoomListener = (roomsListed: TRooms) => {
            console.log('DELETED ROOM');
            dispatch(setRooms(roomsListed));
        };

        const gameStartedListener = (game: Game, roomsListed: TRooms, roomId: number) => {
            console.log('Game started', roomsListed, game);
            navigate('/game');
            dispatch(setRooms(roomsListed));
            dispatch(setInGame(roomId));
            dispatch(updateGame(game));
        };

        socket.emit('list-rooms');
        socket.on('rooms-listed', roomsListedListener);
        socket.on('joined-room', joinedRoomListener);
        socket.on('left-room', leftRoomListener);
        socket.on('room-deleted', deletedRoomListener);
        socket.on('game-started', gameStartedListener);
        return () => {
            socket.off('rooms-listed', roomsListedListener);
            socket.off('joined-room', joinedRoomListener);
            socket.off('left-room', leftRoomListener);
            socket.off('room-deleted', deletedRoomListener);
            socket.off('game-started', gameStartedListener);
        };
    }, []);

    const handleDeleteRoom = (roomId: number, name: string) => {
        socket.emit('delete-room', roomId);
        dispatch(
            setToast({
                id: `delete-room-${roomId}-success`,
                type: 'success',
                message: `You successfully deleted Room ${name}!`,
                duration: 3000,
            }),
        );
    };

    const handleJoinRoom = (username: string, roomId: number, name: string) => {
        console.log('JOIN ROOM', username, roomId);
        socket.emit('join-room', { username, roomId });
        dispatch(
            setToast({
                id: `join-room-${roomId}-success`,
                type: 'success',
                message: `You successfully joined Room ${name}!`,
                duration: 3000,
            }),
        );
    };

    const handleLeaveRoom = (username: string, roomId: number, name: string) => {
        console.log('JOIN ROOM', username, roomId);
        socket.emit('leave-room', { username, roomId });
        dispatch(
            setToast({
                id: `leave-room-${roomId}-success`,
                type: 'success',
                message: `You successfully left Room ${name}!`,
                duration: 3000,
            }),
        );
    };

    const handleStartRoom = (roomId: number, name: string) => {
        socket.emit('start-game', roomId, socket?.id);
        dispatch(
            setToast({
                id: `start-room-${roomId}-success`,
                type: 'success',
                message: `You started game from Room ${name}!`,
                duration: 3000,
            }),
        );
    };

    const isInAnyRoom = Object.values(rooms).some(
        (room: TRoom) =>
            !!room.players.find((player: Player) => {
                console.log(player, user);
                return player.username === user?.username || player.username === 'NO USERNAME';
            }),
    );
    const currentRoom = Object.values(rooms).find(
        (room: TRoom) => !!room.players.find((player: Player) => player.username === user?.username || player.username === 'NO USERNAME'),
    );
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
