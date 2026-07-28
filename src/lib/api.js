const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, isFormData = false, query } = {}) {
  let url = `${API_URL}${path}`;

  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      params.set(key, value);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = {};
  let finalBody = body;
  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(body);
  }

  const res = await fetch(url, { method, headers, body: finalBody, credentials: 'include' });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = data?.message || res.statusText || 'Something went wrong.';
    throw new ApiError(message, res.status, data?.details);
  }

  return data;
}

export function toUploadUrl(path) {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${API_ORIGIN}${path}`;
}

export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
};

export const adminApi = {
  listUsers: (query) => request('/users', { query }),
  setUserVerified: (id, verified) =>
    request(`/users/${id}/verify`, { method: 'PATCH', body: { verified } }),
  setListingStatus: (id, status) =>
    request(`/listings/${id}/status`, { method: 'PATCH', body: { status } }),
};

export const usersApi = {
  updateMe: (payload) => request('/users/me', { method: 'PATCH', body: payload }),
  updatePassword: (payload) => request('/users/me/password', { method: 'PATCH', body: payload }),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return request('/users/me/avatar', { method: 'POST', body: form, isFormData: true });
  },
};

export const listingsApi = {
  list: (query) => request('/listings', { query }),
  get: (id) => request(`/listings/${id}`),
  mine: (query) => request('/listings/mine', { query }),
  create: (formData) => request('/listings', { method: 'POST', body: formData, isFormData: true }),
  update: (id, payload) => request(`/listings/${id}`, { method: 'PATCH', body: payload }),
  addImages: (id, files) => {
    const form = new FormData();
    files.forEach((file) => form.append('images', file));
    return request(`/listings/${id}/images`, { method: 'POST', body: form, isFormData: true });
  },
};

export const neighborhoodsApi = {
  list: () => request('/neighborhoods'),
};

export const savedRoomsApi = {
  list: () => request('/saved-rooms'),
  save: (listingId) => request(`/saved-rooms/${listingId}`, { method: 'POST' }),
  unsave: (listingId) => request(`/saved-rooms/${listingId}`, { method: 'DELETE' }),
};

export const savedSearchesApi = {
  list: () => request('/saved-searches'),
  create: (payload) => request('/saved-searches', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/saved-searches/${id}`, { method: 'PATCH', body: payload }),
  remove: (id) => request(`/saved-searches/${id}`, { method: 'DELETE' }),
};

export const bookingsApi = {
  create: (payload) => request('/bookings', { method: 'POST', body: payload }),
  mine: (query) => request('/bookings/mine', { query }),
  get: (id) => request(`/bookings/${id}`),
  updateStatus: (id, status) => request(`/bookings/${id}/status`, { method: 'PATCH', body: { status } }),
};

export const notificationsApi = {
  list: (query) => request('/notifications', { query }),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),
};

export const dashboardApi = {
  tenant: () => request('/dashboard/tenant'),
  landlord: () => request('/dashboard/landlord'),
};

export const conversationsApi = {
  list: () => request('/conversations'),
  create: (payload) => request('/conversations', { method: 'POST', body: payload }),
  getMessages: (id, query) => request(`/conversations/${id}/messages`, { query }),
  sendMessage: (id, text) => request(`/conversations/${id}/messages`, { method: 'POST', body: { text } }),
  markRead: (id) => request(`/conversations/${id}/read`, { method: 'PATCH' }),
  remove: (id) => request(`/conversations/${id}`, { method: 'DELETE' }),
};
