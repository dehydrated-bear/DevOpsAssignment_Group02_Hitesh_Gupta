import { useState } from 'react';
import { Link } from 'react-router-dom';

import { taskApi } from '../api/client';

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
const STATUS_LABELS = { pending: 'Pending', 'in-progress': 'In Progress', completed: 'Completed' };

export default function TaskItem({ task, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);

  const handleComplete = async () => {
    setCompleting(true);
    setError(null);
    try {
      await taskApi.complete(task._id);
      onDeleted();
    } catch (err) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await taskApi.remove(task._id);
      onDeleted();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const isCompleted = task.status === 'completed';
  const dueLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  return (
    <div className={`task-card status-${task.status}`}>
      <div className="task-card-header">
        <div className="task-card-badges">
          <span className={`badge badge-priority-${task.priority}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          <span className={`badge badge-status-${task.status}`}>
            {STATUS_LABELS[task.status]}
          </span>
        </div>
        {dueLabel && <span className="task-due">Due {dueLabel}</span>}
      </div>

      <h3 className={`task-card-title ${isCompleted ? 'task-title-completed' : ''}`}>
        {task.title}
      </h3>

      {task.description && <p className="task-card-description">{task.description}</p>}

      {task.tags.length > 0 && (
        <div className="task-tags">
          {task.tags.map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="task-card-actions">
        {!isCompleted && (
          <button
            type="button"
            className="btn btn-success"
            onClick={handleComplete}
            disabled={completing}
          >
            {completing ? 'Completing...' : 'Mark Complete'}
          </button>
        )}
        <Link to={`/tasks/${task._id}/edit`} className="btn btn-outline">
          Edit
        </Link>
        <button
          type="button"
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}