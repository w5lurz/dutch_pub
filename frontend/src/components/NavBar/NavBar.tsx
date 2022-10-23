import { Link } from 'react-router-dom';

export default function NavBar() {
    return (
        <div className="bg-blue-400 h-10 px-2 flex gap-2 items-center">
            <Link to="/">Dutch Pub</Link>
            <Link to="/registration">Registration</Link>
            <Link to="/Login">Login</Link>
        </div>
    );
}
