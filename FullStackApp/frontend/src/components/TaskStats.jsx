import { Link } from 'react-router-dom';

import { useTaskStats } from '../hooks/useTasks';

export default function TaskStats() {
  const { stats, loading, error, refresh } = useTaskStats();

  if (loading) {
    return <div className="loading">Loading stats...</div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (!stats) {
    return <div className="empty-state">No statistics available yet.</div>;
  }

  const total = stats.total || 0;
  const completed = stats.completed || 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="stats-page">
      <div className="page-header">
        <h1 className="page-title">Task Statistics</h1>
        <button type="button" className="btn btn-outline" onClick={refresh}>
          Refresh
        </button>
      </div>

      <div className="stats-overview">
        <div className="stat-card stat-card-large">
          <span className="stat-value">{progress}%</span>
          <span className="stat-label">Completion Rate</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{stats.pending || 0}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats['in-progress'] || 0}</span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.completed || 0}</span>
          <span className="stat-label">Completed</span>
        </div>
      </div>

      <p className="stats-footer">
        Need another view?{' '}
        <Link to="/tasks">Return to your task list</Link>
      </p>
    </div>
  );
}