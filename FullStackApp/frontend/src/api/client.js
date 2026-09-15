const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function handleResponse(response) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.message || 'Request failed');
    error.status = response.status;
    throw error;
  }
  return response.json();
}

const request = async (path, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  return handleResponse(response);
};

export const authApi = {
  register: (body) => request('/users/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/users/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/users/me'),
  updateProfile: (body) => request('/users/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  changePassword: (body) => request('/users/password', { method: 'PATCH', body: JSON.stringify(body) })
};

export const taskApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
    ).toString();
    return request(`/tasks?${query}`);
  },
  get: (id) => request(`/tasks/${id}`),
  create: (body) => request('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  complete: (id) => request(`/tasks/${id}/complete`, { method: 'PATCH' }),
  stats: () => request('/tasks/stats'),
  dueSoon: (hours = 24) => request(`/tasks/due-soon?hours=${hours}`)
};

export default request;