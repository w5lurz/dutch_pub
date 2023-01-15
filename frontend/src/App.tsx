import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar';
import Welcome from './components/Welcome/Welcome';
import Login from './components/Login/Login';
import Registration from './components/Registration/Registration';

function App() {
    return (
        <>
            <NavBar />
            <Routes>
                <Route key="welcome" path="/" element={<Welcome />}></Route>
                <Route key="login" path="/login" element={<Login />}></Route>
                <Route key="registration" path="/registration" element={<Registration />}></Route>
            </Routes>
        </>
    );
}

export default App;
