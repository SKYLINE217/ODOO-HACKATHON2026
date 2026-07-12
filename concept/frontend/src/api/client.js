/**
 * api/client.js — Shared API layer
 * All API calls go through apiFetch. Never use raw fetch() outside this file.
 * Token stored in sessionStorage (not localStorage — per authentication-signin.md §6).
 */

const BASE_URL = '/api/v1';

export async function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem('token');

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      // Clear session and redirect to login on any 401
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error(json.error?.message || 'Request failed');
  }

  return json.data; // unwrap envelope
}

// ——— Auth endpoints (MOCKED FOR DEMO) ———
export const authApi = {
  login: async (email, password) => {
    await new Promise(r => setTimeout(r, 500));
    return {
      token: 'demo-jwt-token-12345',
      user: {
        id: 1,
        name: 'Demo User',
        email: email,
        role: 'fleet_manager' // default to fleet_manager so you can see everything
      }
    };
  },

  signup: async (name, email, password, role) => {
    await new Promise(r => setTimeout(r, 500));
    return { token: 'demo', user: { id: 1, name, email, role } };
  },

  me: async () => {
    await new Promise(r => setTimeout(r, 300));
    return {
      id: 1,
      name: 'Demo User',
      email: 'demo@transitops.com',
      role: 'fleet_manager'
    };
  },
};

// ——— Dashboard ———
export const dashboardApi = {
  get: (params = {}) =>
    apiFetch('/dashboard?' + new URLSearchParams(params)),
};

// ——— Vehicles ———
export const vehiclesApi = {
  list:         (params = {}) => apiFetch('/vehicles?' + new URLSearchParams(params)),
  dispatchPool: ()             => apiFetch('/vehicles/dispatch-pool'),
  get:          (id)           => apiFetch(`/vehicles/${id}`),
  create:       (body)         => apiFetch('/vehicles',     { method: 'POST',  body: JSON.stringify(body) }),
  update:       (id, body)     => apiFetch(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete:       (id)           => apiFetch(`/vehicles/${id}`, { method: 'DELETE' }),
};

// ——— Drivers ———
export const driversApi = {
  list:         (params = {}) => apiFetch('/drivers?' + new URLSearchParams(params)),
  dispatchPool: ()             => apiFetch('/drivers/dispatch-pool'),
  get:          (id)           => apiFetch(`/drivers/${id}`),
  create:       (body)         => apiFetch('/drivers',     { method: 'POST',  body: JSON.stringify(body) }),
  update:       (id, body)     => apiFetch(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
};

// ——— Trips ———
export const tripsApi = {
  list:     (params = {}) => apiFetch('/trips?' + new URLSearchParams(params)),
  get:      (id)          => apiFetch(`/trips/${id}`),
  create:   (body)        => apiFetch('/trips',           { method: 'POST',   body: JSON.stringify(body) }),
  dispatch: (id)          => apiFetch(`/trips/${id}/dispatch`, { method: 'POST' }),
  complete: (id)          => apiFetch(`/trips/${id}/complete`, { method: 'POST' }),
  cancel:   (id)          => apiFetch(`/trips/${id}/cancel`,   { method: 'POST' }),
};

// ——— Maintenance ———
export const maintenanceApi = {
  list:   (params = {}) => apiFetch('/maintenance?' + new URLSearchParams(params)),
  create: (body)        => apiFetch('/maintenance', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body)    => apiFetch(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
};

// ——— Fuel & Expenses ———
export const fuelApi = {
  listLogs:     (params = {}) => apiFetch('/fuel-logs?' + new URLSearchParams(params)),
  createLog:    (body)        => apiFetch('/fuel-logs',   { method: 'POST', body: JSON.stringify(body) }),
  listExpenses: (params = {}) => apiFetch('/expenses?'  + new URLSearchParams(params)),
  createExpense:(body)        => apiFetch('/expenses',    { method: 'POST', body: JSON.stringify(body) }),
  totalCost:    ()            => apiFetch('/expenses/total-cost'),
};

// ——— Reports ———
export const reportsApi = {
  get: () => apiFetch('/reports'),
};

// ——— Settings ———
export const settingsApi = {
  get:    ()     => apiFetch('/settings'),
  update: (body) => apiFetch('/settings', { method: 'PUT', body: JSON.stringify(body) }),
};
