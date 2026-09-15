import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useTaskStats } from '../hooks/useTasks';

export default function Dashboard() {
  const { user } = useAuth();
  const { stats, loading } = useTaskStats();

  return (
    <div className="dashboard">
      <section className="hero">
        <h1 className="hero-title">
          {user ? `Welcome back, ${user.name}` : 'DevOps Task Manager'}
        </h1>
        <p className="hero-subtitle">
          Organize your work. Track what matters. Ship faster with a
          containerized full stack app.
        </p>

        <div className="hero-actions">
          {user ? (
            <Link to="/tasks/new" className="btn btn-primary btn-lg">
              Create a New Task
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                I have an account
              </Link>
            </>
          )}
        </div>
      </section>

      {user && stats ? (
        <section className="stats-section">
          <h2 className="section-title">Your Progress</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{stats.total || 0}</span>
              <span className="stat-label">Total Tasks</span>
            </div>
            <div className="stat-card">
              <span className="stat-value stat-pending">{stats.pending || 0}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-card">
              <span className="stat-value stat-progress">{stats['in-progress'] || 0}</span>
              <span className="stat-label">In Progress</span>
            </div>
            <div className="stat-card">
              <span className="stat-value stat-completed">{stats.completed || 0}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
        </section>
      ) : (
        <section className="features">
          <div className="feature">
            <h3>Task Management</h3>
            <p>Create, update, complete, and delete tasks with priorities and due dates.</p>
          </div>
          <div className="feature">
            <h3>Authentication</h3>
            <p>Secure registration and login with JWT-based session handling.</p>
          </div>
          <div className="feature">
            <h3>Docker Ready</h3>
            <p>Everything runs through docker-compose — no manual setup required.</p>
          </div>
        </section>
      )}
    </div>
  );
}