import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar';
import Welcome from './components/Welcome/Welcome';
import Login from './components/Login/Login';
import Registration from './components/Registration/Registration';
import useApp, { SocketContext } from './hooks/useApp';
import Rooms from './components/Rooms/Rooms';

function App() {
    const { socket } = useApp();
    console.log(socket);
    return (
        <SocketContext.Provider value={socket}>
            <NavBar />
            <Routes>
                <Route key="welcome" path="/" element={<Welcome />}></Route>
                <Route key="play" path="/play" element={<Rooms />}></Route>
                <Route key="login" path="/login" element={<Login />}></Route>
                <Route key="registration" path="/registration" element={<Registration />}></Route>
            </Routes>
        </SocketContext.Provider>
    );
}

export default App;
