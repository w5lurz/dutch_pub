import { useContext, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { updateGame } from '../app/gameSlice';
import { useAppSelector } from '../app/hooks';
import { setRooms } from '../app/roomsSlice';
import { RootState } from '../app/store';
import { Game, Player, TRoom, TRooms, User } from '../app/types';
import { setUser } from '../app/userSlice';
import { SocketContext } from './useApp';

export default function useRooms() {
    const socket: Socket = useContext(SocketContext)!;
    let navigate = useNavigate();

    const dispatch = useDispatch();
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

        const gameStartedListener = (roomsListed: TRooms, game: Game) => {
            console.log('Game started', roomsListed, game);
            navigate('/game');
            dispatch(setRooms(roomsListed));
            dispatch(setUser({ ...user, inGame: true } as User));
            dispatch(updateGame(game));
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
        socket.emit('start-game', roomId, socket?.id);
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
