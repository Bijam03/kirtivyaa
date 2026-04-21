import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sc_token');
      localStorage.removeItem('sc_user');
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────
export const authAPI = {
  register:       (data) => api.post('/auth/register', data),
  login:          (data) => api.post('/auth/login', data),
  getMe:          ()     => api.get('/auth/me'),
  updateProfile:  (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ── Products ─────────────────────────────────────────────
export const productAPI = {
  getAll:      (params)    => api.get('/products', { params }),
  getFeatured: ()          => api.get('/products/featured'),
  getById:     (id)        => api.get(`/products/${id}`),
  getBySlug:   (slug)      => api.get(`/products/slug/${slug}`),
  addReview:   (id, data)  => api.post(`/products/${id}/reviews`, data),
  // Admin
  create:  (fd) => api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:  (id, fd) => api.put(`/products/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove:  (id) => api.delete(`/products/${id}`),
};

// ── Product section flags (homepage controls) ────────────
export const productFlagsAPI = {
  getTodaySpecial:    ()         => api.get('/products/today-special'),
  getBestSellers:     ()         => api.get('/products/bestsellers'),
  getNewArrivals:     ()         => api.get('/products/new-arrivals'),
  getFeaturedHampers: ()         => api.get('/products/hampers'),
  updateFlags:        (id, data) => api.patch(`/products/${id}/flags`, data),
};

// ── Orders ───────────────────────────────────────────────
export const orderAPI = {
  create:       (data)   => api.post('/orders', data),
  getMyOrders:  ()       => api.get('/orders/my'),
  getById:      (id)     => api.get(`/orders/${id}`),
  track:        (num)    => api.get(`/orders/track/${num}`),
  // Admin
  getAll:       (params) => api.get('/orders', { params }),
  updateStatus: (id, d)  => api.put(`/orders/${id}/status`, d),
};

// ── Payment ──────────────────────────────────────────────
export const paymentAPI = {
  createRazorpayOrder: (data) => api.post('/payment/create-order', data),
  verifyPayment:       (data) => api.post('/payment/verify', data),
};

// ── Admin ────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
};

// ── Admin user management ────────────────────────────────
export const adminUserAPI = {
  getUsers:    (params) => api.get('/admin/users', { params }),
  updateRole:  (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  toggleBlock: (id)     => api.put(`/admin/users/${id}/block`),
};

// ── Settings (public GET, admin PUT) ─────────────────────
export const settingsAPI = {
  get:    ()     => api.get('/admin/settings'),
  update: (data) => api.put('/admin/settings', data),
};

export default api;
