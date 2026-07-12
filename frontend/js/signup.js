document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form = document.getElementById('signupForm');
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

  // Password strength meter
  if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
      const val = e.target.value;
      const bars = document.querySelectorAll('.strength-bar');
      const label = document.querySelector('.strength-label');
      
      // Reset
      bars.forEach(b => {
        b.className = 'strength-bar';
      });
      
      if (!val) {
        label.textContent = '';
        return;
      }
      
      let strength = 0;
      if (val.length >= 8) strength++;
      if (val.match(/[A-Z]/)) strength++;
      if (val.match(/[0-9]/)) strength++;
      if (val.match(/[^A-Za-z0-9]/)) strength++;
      
      if (val.length < 8) strength = 1; // Weak if too short regardless of complexity
      
      if (strength === 1) {
        bars[0].classList.add('active', 'weak');
        label.textContent = 'Weak';
        label.style.color = 'var(--status-red)';
      } else if (strength === 2) {
        bars[0].classList.add('active', 'fair');
        bars[1].classList.add('active', 'fair');
        label.textContent = 'Fair';
        label.style.color = 'var(--status-orange)';
      } else if (strength === 3) {
        bars[0].classList.add('active', 'good');
        bars[1].classList.add('active', 'good');
        bars[2].classList.add('active', 'good');
        label.textContent = 'Good';
        label.style.color = 'var(--status-blue)';
      } else if (strength >= 4) {
        bars.forEach(b => b.classList.add('active', 'strong'));
        label.textContent = 'Strong';
        label.style.color = 'var(--status-green)';
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    document.querySelectorAll('.form-error').forEach(el => el.classList.remove('visible'));
    document.querySelectorAll('.form-input, .form-select').forEach(el => el.classList.remove('error'));

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;
    
    const license_no = document.getElementById('license_no').value.trim();
    const vehicle_name = document.getElementById('vehicle_name').value.trim();
    const vehicle_no = document.getElementById('vehicle_no').value.trim();

    let hasError = false;

    // Client-side validation
    if (!name) {
      showError('name', 'Name is required');
      hasError = true;
    }
    
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      showError('email', 'Valid email is required');
      hasError = true;
    }
    
    if (!license_no) {
      showError('license_no', 'License number is required');
      hasError = true;
    }

    if (password.length < 8) {
      showError('password', 'Password must be at least 8 characters');
      hasError = true;
    }
    
    if (password !== confirmPassword) {
      showError('confirmPassword', 'Passwords do not match');
      hasError = true;
    }

    if (hasError) return;

    // Set loading state
    btn.disabled = true;
    btn.classList.add('loading');
    btnText.textContent = 'Creating account...';

    try {
      await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role, license_no, vehicle_name, vehicle_no })
      });
      
      showToast('Account created successfully! Please sign in.', 'success');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
      
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.classList.remove('loading');
      btnText.textContent = 'Create Account';
    }
  });

  function showError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}Error`);
    input.classList.add('error');
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }
});
