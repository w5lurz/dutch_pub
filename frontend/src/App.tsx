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

function App() {
    const { socket } = useApp();
    // TODO protected routes???
    return (
        <SocketContext.Provider value={socket}>
            <Toast />
            <div className="flex flex-col h-screen max-h-screen">
                <NavBar />
                <div className="grow">
                    <Routes>
                        <Route key="welcome" path="/" element={<Welcome />}></Route>
                        <Route key="play" path="/play" element={<Rooms />}></Route>
                        <Route key="game" path="/game" element={<Game />}></Route>
                        <Route key="leaderboard" path="/leaderboard" element={<LeaderBoard />}></Route>
                        <Route key="login" path="/login" element={<Login />}></Route>
                        <Route key="registration" path="/registration" element={<Registration />}></Route>
                    </Routes>
                </div>
            </div>
        </SocketContext.Provider>
    );
}

export default App;
