import { Link, NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        DevOps Task Manager
      </Link>

      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Dashboard
        </NavLink>
        {user && (
          <>
            <NavLink to="/tasks" className={({ isActive }) => (isActive ? 'active' : '')}>
              Tasks
            </NavLink>
            <NavLink to="/tasks/new" className={({ isActive }) => (isActive ? 'active' : '')}>
              New Task
            </NavLink>
            <NavLink to="/stats" className={({ isActive }) => (isActive ? 'active' : '')}>
              Stats
            </NavLink>
          </>
        )}
      </div>

      <div className="navbar-auth">
        {user ? (
          <>
            <span className="navbar-user">
              Hello, <strong>{user.name}</strong>
            </span>
            <button type="button" className="btn btn-outline" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}