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
    
    // Load initial tab data
    if (user.role === 'fleet_manager') {
      document.querySelector('[data-tab="dashboard"]').classList.remove('active');
      document.getElementById('tab-dashboard').classList.remove('active');
      document.querySelector('[data-tab="tracking"]').classList.add('active');
      document.getElementById('tab-tracking').classList.add('active');
      loadTabData('tracking');
    } else {
      loadTabData('dashboard');
    }
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
  
  // Apply Role-Based Access Control (RBAC) across entire dashboard
  const rbacItems = document.querySelectorAll('[data-roles]');
  rbacItems.forEach(item => {
    const allowedRoles = item.getAttribute('data-roles');
    if (allowedRoles) {
      if (!allowedRoles.includes(user.role)) {
        item.style.display = 'none';
      } else {
        // preserve flex layout if nav item
        item.style.display = item.classList.contains('nav-item') ? 'flex' : '';
      }
    }
  });

  // Tab Navigation Logic
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      navItems.forEach(nav => nav.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
      
      item.classList.add('active');
      
      const tabName = item.getAttribute('data-tab');
      const targetId = 'tab-' + tabName;
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add('active');
        loadTabData(tabName);
      }
    });
  });
}

const currencyFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

async function loadTabData(tab) {
  try {
    switch (tab) {
      case 'dashboard': await loadDashboardSummary(); break;
      case 'fleet': await loadVehicles(); break;
      case 'drivers': await loadDrivers(); break;
      case 'trips': await loadTrips(); break;
      case 'maintenance': await loadMaintenance(); break;
      case 'fuel': await loadFuelAndExpenses(); break;
      case 'analytics': await loadAnalytics(); break;
      case 'settings': await loadSettings(); break;
      case 'tracking': await loadTracking(); break;
      case 'profile': await loadProfile(); break;
    }
  } catch (err) {
    console.error(err);
    showToast(`Error loading ${tab} data`, 'error');
  }
}

// ── 1. Dashboard Summary ──
async function loadDashboardSummary() {
  const data = await apiFetch('/dashboard/summary');
  const stats = data.stats;
  
  document.getElementById('statActiveVehicles').textContent = stats.active_vehicles;
  document.getElementById('statAvailableVehicles').textContent = stats.available_vehicles;
  document.getElementById('statInMaintenance').textContent = stats.vehicles_in_maintenance;
  document.getElementById('statActiveTrips').textContent = stats.active_trips;
  document.getElementById('statPendingTrips').textContent = stats.pending_trips;
  document.getElementById('statDriversOnDuty').textContent = stats.drivers_on_duty;
  document.getElementById('statFleetUtilization').textContent = `${stats.fleet_utilization}%`;
  
  // Wire up real geolocation tracking for drivers with active trips
  const user = getStoredUser();
  if (user && user.role === 'driver') {
    startDriverGeoTracking();
  }

  const tbody = document.getElementById('recentTripsBody');
  tbody.innerHTML = data.recent_trips.map(t => `
    <tr>
      <td>${t.trip_code}</td>
      <td>${t.vehicle || '—'}</td>
      <td>${t.driver || '—'}</td>
      <td><span class="badge ${getTripBadgeClass(t.status)}">${t.status}</span></td>
      <td>${t.eta || '—'}</td>
    </tr>
  `).join('');

  // Status Chart with Chart.js
  const canvas = document.getElementById('vehicleStatusChartCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const labels = data.vehicle_status.map(s => s.status);
    const dataValues = data.vehicle_status.map(s => s.count);
    
    if (window.vehicleStatusChart) {
      window.vehicleStatusChart.destroy();
    }

    window.vehicleStatusChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Vehicles',
          data: dataValues,
          backgroundColor: '#cb0c9f',
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 32
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { drawBorder: false, display: true, drawOnChartArea: true, drawTicks: false, borderDash: [5, 5] },
            ticks: { padding: 10, font: { size: 11, family: "Open Sans", style: 'normal', lineHeight: 2 }, color: "#b2b9bf" },
          },
          x: {
            grid: { drawBorder: false, display: false, drawOnChartArea: false, drawTicks: false },
            ticks: { display: true, color: '#b2b9bf', padding: 20, font: { size: 11, family: "Open Sans", style: 'normal', lineHeight: 2 } },
          },
        },
      }
    });
  }
}

// ── 2. Fleet Registry ──
async function loadVehicles() {
  const data = await apiFetch('/dashboard/vehicles');
  const tbody = document.getElementById('vehicleTableBody');
  tbody.innerHTML = data.map(v => `
    <tr>
      <td>${v.reg_no}</td>
      <td>${v.name_model}</td>
      <td>${v.type}</td>
      <td>${v.capacity}</td>
      <td>${v.odometer.toLocaleString()}</td>
      <td>${currencyFmt.format(v.acquisition_cost)}</td>
      <td><span class="badge ${getVehicleBadgeClass(v.status)}">${v.status}</span></td>
    </tr>
  `).join('');
}

// ── 3. Drivers ──
async function loadDrivers() {
  const data = await apiFetch('/dashboard/drivers');
  const tbody = document.getElementById('driverTableBody');
  tbody.innerHTML = data.map(d => `
    <tr>
      <td>${d.name}</td>
      <td>${d.license_no}</td>
      <td>${d.category}</td>
      <td>${new Date(d.license_expiry).toLocaleDateString()}</td>
      <td>${d.contact}</td>
      <td>${d.trip_compliance != null ? d.trip_compliance + '%' : 'N/A'}</td>
      <td><span class="badge ${getVehicleBadgeClass(d.safety_status)}">${d.safety_status}</span></td>
      <td><span class="badge ${getVehicleBadgeClass(d.status)}">${d.status}</span></td>
    </tr>
  `).join('');
}

// ── 4. Trips ──
async function loadTrips() {
  const data = await apiFetch('/dashboard/trips');
  const liveBoard = document.getElementById('liveBoard');
  
  liveBoard.innerHTML = data.map(t => `
    <div class="trip-card">
      <div class="trip-card-header">
        <span class="trip-id">${t.trip_code}</span>
        <span class="trip-meta">${t.vehicle_name || 'Unassigned'} / ${t.driver_name || 'Unassigned'}</span>
      </div>
      <div class="trip-route">${t.source} → ${t.destination}</div>
      <div class="trip-footer">
        <span class="badge ${getTripBadgeClass(t.status)}">${t.status}</span>
        <span class="trip-eta">${t.eta || '—'}</span>
      </div>
    </div>
  `).join('');

  // Populate Dropdowns for Create Form
  const vehicles = await apiFetch('/dashboard/vehicles?status=Available');
  const vSelect = document.getElementById('tripVehicle');
  vSelect.innerHTML = '<option value="">Select vehicle...</option>' + vehicles.map(v => `<option value="${v.id}" data-cap="${v.capacity_kg}">${v.name_model} - ${v.capacity}</option>`).join('');
  
  const drivers = await apiFetch('/dashboard/drivers?status=Available');
  const dSelect = document.getElementById('tripDriver');
  dSelect.innerHTML = '<option value="">Select driver...</option>' + drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
}

document.getElementById('createTripForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const vId = document.getElementById('tripVehicle').value;
  const cargo = document.getElementById('tripCargoWeight').value;
  const vSelect = document.getElementById('tripVehicle');
  const cap = vSelect.options[vSelect.selectedIndex]?.getAttribute('data-cap');
  
  if (vId && cargo && Number(cargo) > Number(cap)) {
    showToast('Capacity exceeded. Cannot dispatch.', 'error');
    return;
  }

  const payload = {
    source: document.getElementById('tripSource').value,
    destination: document.getElementById('tripDestination').value,
    vehicle_id: vId || null,
    driver_id: document.getElementById('tripDriver').value || null,
    cargo_weight_kg: cargo || 0,
    planned_distance_km: document.getElementById('tripDistance').value || 0
  };

  await apiFetch('/dashboard/trips', { method: 'POST', body: JSON.stringify(payload) });
  showToast('Trip created successfully', 'success');
  e.target.reset();
  loadTrips();
});

// ── 5. Maintenance ──
async function loadMaintenance() {
  const data = await apiFetch('/dashboard/maintenance');
  const tbody = document.getElementById('maintenanceTableBody');
  tbody.innerHTML = data.map(m => `
    <tr>
      <td>${m.vehicle_name}</td>
      <td>${m.service_type}</td>
      <td>${currencyFmt.format(m.cost)}</td>
      <td><span class="badge ${m.status === 'Completed' ? 'badge-good' : 'badge-warning'}">${m.status}</span></td>
    </tr>
  `).join('');

  const vehicles = await apiFetch('/dashboard/vehicles');
  const vSelect = document.getElementById('maintVehicle');
  vSelect.innerHTML = '<option value="">Select vehicle...</option>' + vehicles.map(v => `<option value="${v.id}">${v.name_model}</option>`).join('');
}

// ── 6. Fuel & Expenses ──
async function loadFuelAndExpenses() {
  const fuel = await apiFetch('/dashboard/fuel-logs');
  document.getElementById('fuelTableBody').innerHTML = fuel.map(f => `
    <tr>
      <td>${f.vehicle_name}</td>
      <td>${new Date(f.log_date).toLocaleDateString()}</td>
      <td>${f.liters} L</td>
      <td>${currencyFmt.format(f.fuel_cost)}</td>
    </tr>
  `).join('');

  const expenses = await apiFetch('/dashboard/expenses');
  document.getElementById('expenseTableBody').innerHTML = expenses.map(e => `
    <tr>
      <td>${e.trip_code || '—'}</td>
      <td>${e.vehicle_name || '—'}</td>
      <td>${currencyFmt.format(e.toll)}</td>
      <td>${currencyFmt.format(e.other)}</td>
      <td>${currencyFmt.format(e.maint_linked)}</td>
      <td><span class="badge ${e.trip_status === 'Completed' ? 'badge-good' : 'badge-good'}">${currencyFmt.format(e.total)}</span></td>
    </tr>
  `).join('');

  const totalFuel = fuel.reduce((s, f) => s + parseFloat(f.fuel_cost), 0);
  const totalExpMaint = expenses.reduce((s, e) => s + parseFloat(e.maint_linked), 0);
  document.getElementById('totalOperationalCost').textContent = currencyFmt.format(totalFuel + totalExpMaint);
}

// ── 7. Analytics ──
async function loadAnalytics() {
  const data = await apiFetch('/dashboard/analytics');
  document.getElementById('analyticsFuelEfficiency').textContent = data.fuel_efficiency;
  document.getElementById('analyticsFleetUtil').textContent = data.fleet_utilization;
  document.getElementById('analyticsOpCost').textContent = currencyFmt.format(data.operational_cost);
  document.getElementById('analyticsROI').textContent = data.vehicle_roi;

  // ── Costliest Vehicles Chart (Bar) ──
  const costliestCanvas = document.getElementById('costliestVehiclesChartCanvas');
  if (costliestCanvas) {
    const ctx = costliestCanvas.getContext('2d');
    const labels = data.costliest_vehicles.map(v => v.name_model);
    const dataValues = data.costliest_vehicles.map(v => v.total_cost);
    
    if (window.costliestChart) window.costliestChart.destroy();
    
    window.costliestChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Cost (₹)',
          data: dataValues,
          backgroundColor: '#3A416F',
          borderRadius: 4,
          maxBarThickness: 32
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { borderDash: [5, 5] }, ticks: { padding: 10, color: "#b2b9bf" } },
          x: { grid: { display: false }, ticks: { color: '#b2b9bf', padding: 20 } }
        }
      }
    });
  }

  // ── Monthly Revenue Chart (Line) ──
  const revenueCanvas = document.getElementById('monthlyRevenueChartCanvas');
  if (revenueCanvas) {
    const ctx = revenueCanvas.getContext('2d');
    if (window.revenueChart) window.revenueChart.destroy();
    
    const gradientStroke1 = ctx.createLinearGradient(0, 230, 0, 50);
    gradientStroke1.addColorStop(1, 'rgba(203,12,159,0.2)');
    gradientStroke1.addColorStop(0.2, 'rgba(72,72,176,0.0)');
    gradientStroke1.addColorStop(0, 'rgba(203,12,159,0)');
    
    // Use real data from backend API response
    const revenueLabels = (data.monthly_revenue && data.monthly_revenue.length > 0)
      ? data.monthly_revenue.map(m => m.month)
      : ['No data'];
    const revenueData = (data.monthly_revenue && data.monthly_revenue.length > 0)
      ? data.monthly_revenue.map(m => parseFloat(m.km) || 0)
      : [0];

    window.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: revenueLabels,
        datasets: [{
          label: "Distance (km)",
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 0,
          borderColor: "#cb0c9f",
          backgroundColor: gradientStroke1,
          fill: true,
          data: revenueData,
          maxBarThickness: 6
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        interaction: { intersect: false, mode: 'index' },
        scales: {
          y: { grid: { borderDash: [5, 5] }, ticks: { padding: 10, color: '#b2b9bf' } },
          x: { grid: { display: false }, ticks: { padding: 10, color: '#b2b9bf' } }
        }
      }
    });
  }
}

// ── User Profile ──
async function loadProfile() {
  const user = getStoredUser();
  document.getElementById('profileName').value = user.name || '';
  document.getElementById('profileEmail').value = user.email || '';
}

document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('profileName').value;
  const email = document.getElementById('profileEmail').value;

  try {
    const updatedUser = await apiFetch('/dashboard/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, email })
    });
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
    initDashboard(updatedUser);
    showToast('Profile updated successfully', 'success');
  } catch (err) {
    showToast(err.message || 'Failed to update profile', 'error');
  }
});

document.getElementById('passwordForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const current_password = document.getElementById('profileCurrentPassword').value;
  const new_password = document.getElementById('profileNewPassword').value;

  try {
    await apiFetch('/dashboard/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ current_password, new_password })
    });
    showToast('Password changed successfully', 'success');
    e.target.reset();
    document.getElementById('pwdMeter').style.width = '0%';
  } catch (err) {
    showToast(err.message || 'Failed to change password', 'error');
  }
});

// Password Strength Meter
document.getElementById('profileNewPassword')?.addEventListener('input', (e) => {
  const val = e.target.value;
  const meter = document.getElementById('pwdMeter');
  const txt = document.getElementById('pwdStrengthTxt');
  
  if (val.length === 0) {
    meter.style.width = '0%';
    txt.textContent = 'Enter at least 8 characters';
  } else if (val.length < 8) {
    meter.style.width = '33%';
    meter.style.background = 'var(--status-red)';
    txt.textContent = 'Too short (min 8)';
  } else if (val.length < 12) {
    meter.style.width = '66%';
    meter.style.background = 'var(--status-warning)';
    txt.textContent = 'Medium';
  } else {
    meter.style.width = '100%';
    meter.style.background = 'var(--status-green)';
    txt.textContent = 'Strong';
  }
});

// Delete Account button
document.getElementById('btnDeleteAccount')?.addEventListener('click', () => {
  if (confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.")) {
    showToast('Account deletion requested. Support will contact you shortly.', 'info');
  }
});

// Settings Nav Logic
document.querySelectorAll('.settings-nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    document.querySelectorAll('.settings-nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelectorAll('.settings-section').forEach(sec => sec.style.display = 'none');
    
    item.classList.add('active');
    const targetId = item.getAttribute('data-target');
    if (document.getElementById(targetId)) {
      document.getElementById(targetId).style.display = 'block';
    }
  });
});

// ── 8. Settings ──
async function loadSettings() {
  const data = await apiFetch('/dashboard/settings');
  document.getElementById('settingDepotName').value = data.depot_name;
  document.getElementById('settingCurrency').value = data.currency;
  document.getElementById('settingDistanceUnit').value = data.distance_unit;
}

// ── Helpers ──
function getVehicleBadgeClass(status) {
  switch (status) {
    case 'Available': return 'badge-good';
    case 'On Trip': return 'badge-blue';
    case 'In Shop': return 'badge-warning';
    case 'Suspended': return 'badge-warning';
    case 'Off Duty': return 'badge-gray';
    case 'Retired': return 'badge-red';
    default: return 'badge-gray';
  }
}

function getTripBadgeClass(status) {
  switch (status) {
    case 'Draft': return 'badge-gray';
    case 'Dispatched': return 'badge-blue';
    case 'Completed': return 'badge-good';
    case 'Cancelled': return 'badge-red';
    default: return 'badge-gray';
  }
}

// ── GPS Tracking Logic ──
let trackingMap = null;
let trackingMarkers = {};
let trackingInterval = null;

async function loadTracking() {
  // Initialize map once
  if (!trackingMap) {
    trackingMap = L.map('mapContainer').setView([22.2587, 71.1924], 6); // Centered on Gujarat area
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(trackingMap);
    
    // Fix Leaflet's default icon path issues when using CDN without proper image roots
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }

  // Force map to recalculate its size in case the container was hidden when initialized
  setTimeout(() => {
    trackingMap.invalidateSize();
  }, 300);

  // Initial fetch
  await fetchAndRenderLocations();

  // Setup polling
  if (trackingInterval) clearInterval(trackingInterval);
  trackingInterval = setInterval(fetchAndRenderLocations, 15000);
}

async function fetchAndRenderLocations() {
  try {
    const locations = await apiFetch('/tracking/active');
    
    locations.forEach(loc => {
      const latLng = [loc.latitude, loc.longitude];
      const popupHTML = `
        <div style="font-family: var(--font-primary); font-size: 0.9rem;">
          <strong style="color: var(--status-blue);">${loc.reg_no}</strong><br>
          <span style="color: var(--text-muted); font-size: 0.8rem;">Driver:</span> ${loc.driver_name || 'N/A'}<br>
          <span style="color: var(--text-muted); font-size: 0.8rem;">Route:</span> ${loc.source || '?'} &rarr; ${loc.destination || '?'}<br>
          <span style="color: var(--text-muted); font-size: 0.75rem; margin-top: 5px; display: block;">
            Updated: ${new Date(loc.recorded_at).toLocaleTimeString()}
          </span>
        </div>
      `;

      if (trackingMarkers[loc.vehicle_id]) {
        trackingMarkers[loc.vehicle_id].setLatLng(latLng);
        trackingMarkers[loc.vehicle_id].setPopupContent(popupHTML);
      } else {
        const marker = L.marker(latLng).addTo(trackingMap);
        marker.bindPopup(popupHTML);
        trackingMarkers[loc.vehicle_id] = marker;
      }
    });
  } catch (err) {
    console.error('Error fetching live tracking data:', err);
  }
}

// Ensure polling stops if user navigates to another tab
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    const tabName = item.getAttribute('data-tab');
    if (tabName !== 'tracking') {
      if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
      }
    }
  });
});

// ── Modal UI Logic & Forms ──
function showModal(title, formHTML, onSubmit) {
  const overlay = document.getElementById('modalOverlay');
  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalBody');
  const closeBtn = document.getElementById('modalClose');

  titleEl.textContent = title;
  bodyEl.innerHTML = formHTML;
  overlay.style.display = 'flex';

  const form = bodyEl.querySelector('form');
  if (form && onSubmit) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving...'; }
      await onSubmit(e, form);
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save'; }
    });
  }

  const closeModal = () => { overlay.style.display = 'none'; };
  closeBtn.onclick = closeModal;
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

// ── Button Event Listeners ──
document.addEventListener('DOMContentLoaded', () => {
  // Add Vehicle
  const addVehicleBtn = document.getElementById('addVehicleBtn');
  if (addVehicleBtn) {
    addVehicleBtn.addEventListener('click', () => {
      const formHTML = `
        <form id="addVehicleForm">
          <div class="form-group"><label class="form-label">Reg. No</label><input type="text" name="reg_no" class="form-input" required></div>
          <div class="form-group"><label class="form-label">Name/Model</label><input type="text" name="name" class="form-input" required></div>
          <div class="form-group"><label class="form-label">Type</label>
            <select name="type" class="form-select">
              <option value="Van">Van</option><option value="Truck">Truck</option><option value="Mini">Mini</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Capacity (kg)</label><input type="number" name="capacity" class="form-input" required></div>
          <div class="form-group"><label class="form-label">Acquisition Cost</label><input type="number" name="acquisition_cost" class="form-input" required></div>
          <button type="submit" class="btn btn-primary">Save Vehicle</button>
        </form>
      `;
      showModal('Add New Vehicle', formHTML, async (e, form) => {
        const fd = new FormData(form);
        const payload = Object.fromEntries(fd.entries());
        payload.capacity = Number(payload.capacity);
        payload.acquisition_cost = Number(payload.acquisition_cost);
        
        try {
          await apiFetch('/dashboard/vehicles', { method: 'POST', body: JSON.stringify(payload) });
          showToast('Vehicle added successfully', 'success');
          document.getElementById('modalOverlay').style.display = 'none';
          loadFleet();
        } catch(err) { showToast(err.message, 'error'); }
      });
    });
  }

  // Add Driver
  const addDriverBtn = document.getElementById('addDriverBtn');
  if (addDriverBtn) {
    addDriverBtn.addEventListener('click', () => {
      const formHTML = `
        <form id="addDriverForm">
          <div class="form-group"><label class="form-label">Full Name</label><input type="text" name="name" class="form-input" required></div>
          <div class="form-group"><label class="form-label">License No</label><input type="text" name="license_no" class="form-input" required></div>
          <div class="form-group"><label class="form-label">License Category</label><input type="text" name="license_category" class="form-input" required></div>
          <div class="form-group"><label class="form-label">License Expiry</label><input type="date" name="license_expiry" class="form-input" required></div>
          <div class="form-group"><label class="form-label">Contact</label><input type="text" name="contact_number" class="form-input" required></div>
          <button type="submit" class="btn btn-primary">Save Driver</button>
        </form>
      `;
      showModal('Add New Driver', formHTML, async (e, form) => {
        const fd = new FormData(form);
        try {
          await apiFetch('/dashboard/drivers', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd.entries())) });
          showToast('Driver added successfully', 'success');
          document.getElementById('modalOverlay').style.display = 'none';
          loadDrivers();
        } catch(err) { showToast(err.message, 'error'); }
      });
    });
  }

  // Add Fuel Log
  const addFuelBtn = document.getElementById('addFuelBtn');
  if (addFuelBtn) {
    addFuelBtn.addEventListener('click', () => {
      const formHTML = `
        <form id="addFuelForm">
          <div class="form-group"><label class="form-label">Vehicle ID</label><input type="number" name="vehicle_id" class="form-input" required></div>
          <div class="form-group"><label class="form-label">Date</label><input type="date" name="log_date" class="form-input" required></div>
          <div class="form-group"><label class="form-label">Liters</label><input type="number" step="0.1" name="liters" class="form-input" required></div>
          <div class="form-group"><label class="form-label">Cost</label><input type="number" step="0.01" name="cost" class="form-input" required></div>
          <button type="submit" class="btn btn-primary">Save Fuel Log</button>
        </form>
      `;
      showModal('Add Fuel Log', formHTML, async (e, form) => {
        const fd = new FormData(form);
        const payload = Object.fromEntries(fd.entries());
        payload.vehicle_id = Number(payload.vehicle_id);
        payload.liters = Number(payload.liters);
        payload.cost = Number(payload.cost);
        
        try {
          await apiFetch('/dashboard/fuel-logs', { method: 'POST', body: JSON.stringify(payload) });
          showToast('Fuel log added', 'success');
          document.getElementById('modalOverlay').style.display = 'none';
          loadFuel();
        } catch(err) { showToast(err.message, 'error'); }
      });
    });
  }
  // Add Expense
  const addExpenseBtn = document.getElementById('addExpenseBtn');
  if (addExpenseBtn) {
    addExpenseBtn.addEventListener('click', () => {
      const formHTML = `
        <form id="addExpenseForm">
          <div class="form-group"><label class="form-label">Category</label><input type="text" name="category" class="form-input" required></div>
          <div class="form-group"><label class="form-label">Amount</label><input type="number" step="0.01" name="amount" class="form-input" required></div>
          <div class="form-group"><label class="form-label">Date</label><input type="date" name="expense_date" class="form-input" required></div>
          <button type="submit" class="btn btn-primary">Save Expense</button>
        </form>
      `;
      showModal('Add Expense', formHTML, async (e, form) => {
        const fd = new FormData(form);
        const payload = Object.fromEntries(fd.entries());
        payload.amount = Number(payload.amount);
        
        try {
          await apiFetch('/dashboard/expenses', { method: 'POST', body: JSON.stringify(payload) });
          showToast('Expense added', 'success');
          document.getElementById('modalOverlay').style.display = 'none';
          loadAnalytics();
        } catch(err) { showToast(err.message, 'error'); }
      });
    });
  }

  // Add Maintenance Record
  const createMaintenanceForm = document.getElementById('createMaintenanceForm');
  if (createMaintenanceForm) {
    createMaintenanceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        vehicle_id: Number(document.getElementById('maintVehicle').value),
        service_type: document.getElementById('maintServiceType').value,
        cost: Number(document.getElementById('maintCost').value),
        date: document.getElementById('maintDate').value,
        status: document.getElementById('maintStatus').value
      };
      
      try {
        await apiFetch('/dashboard/maintenance', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Maintenance logged', 'success');
        createMaintenanceForm.reset();
        // Option to refresh fleet data or maintenance list
      } catch(err) { showToast(err.message, 'error'); }
    });
  }
});

// ── Driver Geolocation Tracking ──
// Uses navigator.geolocation.watchPosition() to POST real coordinates
// to the backend tracking endpoint when a driver has an active trip.
let geoWatchId = null;
let lastGeoSend = 0;

async function startDriverGeoTracking() {
  if (!navigator.geolocation) {
    const locEl = document.getElementById('statDriverLocation');
    if (locEl) locEl.textContent = 'Geolocation not supported';
    return;
  }

  // First find the driver's dispatched trip to get vehicle_id
  try {
    const trips = await apiFetch('/dashboard/trips');
    const user = getStoredUser();
    const activeTrip = trips.find(t =>
      t.status === 'Dispatched' && t.driver_name === user.name
    );

    if (!activeTrip || !activeTrip.vehicle_id) {
      const locEl = document.getElementById('statDriverLocation');
      if (locEl) locEl.textContent = 'No active trip';
      return;
    }

    const vehicleId = activeTrip.vehicle_id;

    geoWatchId = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        // Only send every 10 seconds
        if (now - lastGeoSend < 10000) return;
        lastGeoSend = now;

        const { latitude, longitude } = position.coords;

        try {
          await apiFetch('/tracking', {
            method: 'POST',
            body: JSON.stringify({ vehicle_id: vehicleId, latitude, longitude })
          });

          const locEl = document.getElementById('statDriverLocation');
          if (locEl) locEl.textContent = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        } catch (err) {
          console.error('Failed to send location:', err);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        const locEl = document.getElementById('statDriverLocation');
        if (locEl) {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              locEl.textContent = 'Location permission denied';
              break;
            case err.POSITION_UNAVAILABLE:
              locEl.textContent = 'Location unavailable';
              break;
            default:
              locEl.textContent = 'Location error';
          }
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
  } catch (err) {
    console.error('Error setting up geo tracking:', err);
  }
}

// Cleanup geo tracking when leaving the page
window.addEventListener('beforeunload', () => {
  if (geoWatchId !== null) {
    navigator.geolocation.clearWatch(geoWatchId);
  }
});
