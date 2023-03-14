import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar';
import Welcome from './components/Welcome/Welcome';
import Login from './components/Login/Login';
import Registration from './components/Registration/Registration';
import useApp, { SocketContext } from './hooks/useApp';
import Rooms from './components/Rooms/Rooms';
import Game from './components/Game/Game';
import LeaderBoard from './components/LeaderBoard/LeaderBoard';
import Toast from './components/Toast/Toast';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { RootState } from './app/store';
import { useEffect } from 'react';
import { setToast } from './app/generalSlice';

function App() {
    const { socket } = useApp();
    const dispatch = useAppDispatch();
    useEffect(() => {
        dispatch(
            setToast({
                type: 'success',
                message: 'asd won the game! Congratulations!',
                duration: 3000,
                position: 'topCenter',
            }),
        );
    }, []);
    // TODO protected routes???
    return (
        <SocketContext.Provider value={socket}>
            <Toast />
            <NavBar />
            <Routes>
                <Route key="welcome" path="/" element={<Welcome />}></Route>
                <Route key="play" path="/play" element={<Rooms />}></Route>
                <Route key="game" path="/game" element={<Game />}></Route>
                <Route key="leaderboard" path="/leaderboard" element={<LeaderBoard />}></Route>
                <Route key="login" path="/login" element={<Login />}></Route>
                <Route key="registration" path="/registration" element={<Registration />}></Route>
            </Routes>
        </SocketContext.Provider>
    );
}

export default App;
