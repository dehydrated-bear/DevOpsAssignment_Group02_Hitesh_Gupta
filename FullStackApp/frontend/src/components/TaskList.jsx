import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useTasks } from '../hooks/useTasks';
import TaskItem from './TaskItem';

export default function TaskList() {
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const { tasks, pagination, loading, error, refetch } = useTasks(filters);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleTaskDeleted = () => {
    refetch();
  };

  return (
    <div className="task-list-page">
      <div className="page-header">
        <h1 className="page-title">Your Tasks</h1>
        <Link to="/tasks/new" className="btn btn-primary">
          + New Task
        </Link>
      </div>

      <div className="filters">
        <input
          type="search"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search tasks..."
          className="filter-search"
        />
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select name="priority" value={filters.priority} onChange={handleFilterChange}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading">Loading tasks...</div>}

      {!loading && !error && tasks.length === 0 && (
        <div className="empty-state">
          <p>No tasks found.</p>
          <Link to="/tasks/new" className="btn btn-outline">
            Create your first task
          </Link>
        </div>
      )}

      {!loading && tasks.length > 0 && (
        <>
          <div className="task-grid">
            {tasks.map((task) => (
              <TaskItem key={task._id} task={task} onDeleted={handleTaskDeleted} />
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <span>
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} tasks)
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}