document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form = document.getElementById('loginForm');
  const btn = form.querySelector('.btn-primary');
  const btnText = btn.querySelector('.btn-text');

  // Password toggle
  const toggleBtn = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      toggleBtn.textContent = type === 'password' ? '👁' : '👁‍🗨';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showToast('Email and password are required', 'error');
      return;
    }

    // Set loading state
    btn.disabled = true;
    btn.classList.add('loading');
    btnText.textContent = 'Signing in...';

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      // Store token and user data in sessionStorage per design.md §6
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      
      showToast('Login successful!', 'success');
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
      
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.classList.remove('loading');
      btnText.textContent = 'Sign In';
      
      // Clear password field on failure
      document.getElementById('password').value = '';
    }
  });

  // Demo Login Buttons
  const demoBtns = document.querySelectorAll('.demo-btn');
  demoBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('email').value = btn.dataset.email;
      document.getElementById('password').value = btn.dataset.password;
      form.dispatchEvent(new Event('submit'));
    });
  });
});
