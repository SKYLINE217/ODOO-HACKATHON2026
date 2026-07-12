document.addEventListener('DOMContentLoaded', async () => {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  const cachedUser = getStoredUser();
  if (cachedUser) {
    initDashboard(cachedUser);
  }

  try {
    const user = await apiFetch('/auth/me');
    sessionStorage.setItem('user', JSON.stringify(user));
    initDashboard(user);
    
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('appLayout').style.display = 'flex';
  } catch (err) {
    showToast('Failed to load profile data', 'error');
  }

  document.getElementById('logoutBtn').addEventListener('click', logout);
});

function initDashboard(user) {
  // Update Topbar
  document.getElementById('userName').textContent = user.name;
  
  const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('userAvatar').textContent = initials;
  
  const roleLabel = user.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  document.getElementById('userRole').textContent = roleLabel;
  
  // Dashboard Info
  document.getElementById('welcomeName').textContent = user.name.split(' ')[0];
  document.getElementById('infoName').textContent = user.name;
  document.getElementById('infoEmail').textContent = user.email;
  document.getElementById('infoRole').textContent = roleLabel;
  
  // Apply Role-Based Access Control (RBAC) to Sidebar
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    const allowedRoles = item.getAttribute('data-roles');
    if (allowedRoles) {
      if (!allowedRoles.includes(user.role)) {
        item.style.display = 'none';
      } else {
        item.style.display = 'flex';
      }
    }
  });

  // Tab Navigation Logic
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all nav items and hide all tab panes
      navItems.forEach(nav => nav.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
      
      // Add active to current
      item.classList.add('active');
      
      // Show target tab
      const targetId = 'tab-' + item.getAttribute('data-tab');
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });
}
