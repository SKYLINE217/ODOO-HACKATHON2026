/**
 * Shared API layer — frontend.md §2
 * All API calls go through apiFetch(). Bearer token from sessionStorage.
 * On 401 from any endpoint → clear session → redirect to login.
 */

// Make sure this matches the PORT in backend/.env
const API_BASE = 'http://localhost:3001/api/v1';

async function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem('token');

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    // authentication-signin.md §6: on 401, clear token and redirect to login
    if (res.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = 'login.html';
      throw new Error('Session expired. Redirecting to login.');
    }
    // Throw the server's error message so callers can display it
    throw new Error(json.error?.message || `Request failed (${res.status})`);
  }

  return json.data; // Unwrap the { success, data } envelope
}

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.innerText = str;
  return div.innerHTML;
}

/* ── Toast notification system ── */
function showToast(message, type = 'error') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span>${escapeHTML(message)}</span>
  `;

  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove());
  }, 4000);
}

/* ── Auth helpers ── */
function isLoggedIn() {
  return !!sessionStorage.getItem('token');
}

function getStoredUser() {
  const raw = sessionStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

function logout() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  window.location.href = 'login.html';
}
