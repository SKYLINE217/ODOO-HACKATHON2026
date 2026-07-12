document.addEventListener('DOMContentLoaded', async () => {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  // Display initial user data from sessionStorage immediately for fast paint
  const cachedUser = getStoredUser();
  if (cachedUser) {
    renderUser(cachedUser);
  }

  // Fetch fresh user data from /auth/me
  try {
    const user = await apiFetch('/auth/me');
    // Update cache
    sessionStorage.setItem('user', JSON.stringify(user));
    renderUser(user);
    
    // Hide loading screen, show dashboard content
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';
  } catch (err) {
    // apiFetch already handles 401 redirect, just show toast for other errors
    showToast('Failed to load profile data', 'error');
  }

  // Logout handler
  document.getElementById('logoutBtn').addEventListener('click', logout);
});

function renderUser(user) {
  // Topbar
  document.getElementById('userName').textContent = user.name;
  
  // Create initials
  const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('userAvatar').textContent = initials;
  
  // Format role label (e.g. "fleet_manager" -> "Fleet Manager")
  const roleLabel = user.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  document.getElementById('userRole').textContent = roleLabel;
  
  // Welcome card
  document.getElementById('welcomeName').textContent = user.name.split(' ')[0];
  
  // Info grid
  document.getElementById('infoName').textContent = user.name;
  document.getElementById('infoEmail').textContent = user.email;
  document.getElementById('infoRole').textContent = roleLabel;
  
  // Format date if available
  if (user.created_at) {
    const date = new Date(user.created_at);
    document.getElementById('infoJoined').textContent = date.toLocaleDateString();
  }
}
