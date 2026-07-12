/**
 * api/mock.js — Mock data matching exact backend response shapes.
 * Import these in pages while the backend isn't live yet.
 * Swap them out for real apiFetch calls endpoint-by-endpoint.
 *
 * Usage:
 *   import { mockVehicles } from '../api/mock';
 *   // replace with: import { vehiclesApi } from '../api/client';
 */

export const mockUser = {
  id: 1,
  name: 'Raven K.',
  email: 'raven@transitops.com',
  role: 'fleet_manager',
};

export const mockDashboard = {
  kpis: {
    total_vehicles: 42,
    active_trips: 7,
    drivers_available: 18,
    vehicles_in_shop: 5,
    fuel_cost_today: 1240,
    trips_completed_today: 14,
    compliance_rate: 94,
  },
  recent_trips: [
    { id: 'TRP-001', source: 'Depot A', destination: 'Site North', driver: 'J. Morris', vehicle: 'VH-204', status: 'completed', planned_distance_km: 85 },
    { id: 'TRP-002', source: 'Depot B', destination: 'Port West',  driver: 'L. Chen',   vehicle: 'VH-109', status: 'on_trip',   planned_distance_km: 120 },
    { id: 'TRP-003', source: 'Depot A', destination: 'Site East',  driver: 'K. Patel',  vehicle: 'VH-315', status: 'dispatched',planned_distance_km: 60 },
    { id: 'TRP-004', source: 'Depot C', destination: 'Depot A',    driver: 'M. Torres', vehicle: 'VH-207', status: 'draft',     planned_distance_km: 45 },
    { id: 'TRP-005', source: 'Depot B', destination: 'Site South', driver: 'A. Osei',   vehicle: 'VH-401', status: 'cancelled', planned_distance_km: 95 },
  ],
  vehicle_status_breakdown: [
    { status: 'available', count: 30 },
    { status: 'on_trip',   count: 7  },
    { status: 'in_shop',   count: 5  },
    { status: 'retired',   count: 0  },
  ],
};

export const mockVehicles = [
  { id: 1, registration_no: 'VH-204', type: 'truck',    model: 'Volvo FH16',      status: 'available', region: 'North', max_load_capacity_kg: 20000 },
  { id: 2, registration_no: 'VH-109', type: 'van',      model: 'Mercedes Sprinter',status: 'on_trip',  region: 'West',  max_load_capacity_kg: 3500  },
  { id: 3, registration_no: 'VH-315', type: 'truck',    model: 'Scania R500',      status: 'available', region: 'East',  max_load_capacity_kg: 25000 },
  { id: 4, registration_no: 'VH-207', type: 'bus',      model: 'MAN Lion\'s City', status: 'in_shop',  region: 'South', max_load_capacity_kg: 0     },
  { id: 5, registration_no: 'VH-401', type: 'truck',    model: 'DAF XF105',        status: 'available', region: 'North', max_load_capacity_kg: 18000 },
  { id: 6, registration_no: 'VH-512', type: 'van',      model: 'Ford Transit',     status: 'retired',  region: 'West',  max_load_capacity_kg: 2000  },
];

export const mockDispatchVehicles = mockVehicles.filter(v => v.status === 'available');

export const mockDrivers = [
  { id: 1, name: 'J. Morris',  license_no: 'DL-4821', license_expiry: '2026-09-15', safety_status: 'available', status: 'available',  phone: '+1-555-0101' },
  { id: 2, name: 'L. Chen',    license_no: 'DL-3390', license_expiry: '2025-12-01', safety_status: 'available', status: 'on_trip',    phone: '+1-555-0102' },
  { id: 3, name: 'K. Patel',   license_no: 'DL-7714', license_expiry: '2024-06-30', safety_status: 'expired',   status: 'suspended',  phone: '+1-555-0103' },
  { id: 4, name: 'M. Torres',  license_no: 'DL-5502', license_expiry: '2027-03-20', safety_status: 'available', status: 'off_duty',   phone: '+1-555-0104' },
  { id: 5, name: 'A. Osei',    license_no: 'DL-9981', license_expiry: '2026-11-10', safety_status: 'available', status: 'available',  phone: '+1-555-0105' },
];

export const mockDispatchDrivers = mockDrivers.filter(d => d.status === 'available');

export const mockTrips = [
  { id: 'TRP-001', source: 'Depot A', destination: 'Site North', vehicle_id: 1, driver_id: 1, cargo_weight_kg: 8000,  planned_distance_km: 85,  status: 'completed',  created_at: '2026-07-11T08:00:00Z' },
  { id: 'TRP-002', source: 'Depot B', destination: 'Port West',  vehicle_id: 2, driver_id: 2, cargo_weight_kg: 2200,  planned_distance_km: 120, status: 'on_trip',    created_at: '2026-07-12T06:30:00Z' },
  { id: 'TRP-003', source: 'Depot A', destination: 'Site East',  vehicle_id: 3, driver_id: 5, cargo_weight_kg: 12000, planned_distance_km: 60,  status: 'dispatched', created_at: '2026-07-12T07:00:00Z' },
  { id: 'TRP-004', source: 'Depot C', destination: 'Depot A',    vehicle_id: 5, driver_id: 4, cargo_weight_kg: 0,     planned_distance_km: 45,  status: 'draft',      created_at: '2026-07-12T08:00:00Z' },
];

export const mockMaintenance = [
  { id: 1, vehicle_id: 4, vehicle_reg: 'VH-207', service_type: 'Engine Overhaul', cost: 4200, date: '2026-07-10', status: 'in_progress' },
  { id: 2, vehicle_id: 1, vehicle_reg: 'VH-204', service_type: 'Oil Change',       cost: 180,  date: '2026-07-08', status: 'completed'  },
  { id: 3, vehicle_id: 3, vehicle_reg: 'VH-315', service_type: 'Tyre Replacement', cost: 960,  date: '2026-07-05', status: 'completed'  },
];

export const mockFuelLogs = [
  { id: 1, vehicle_reg: 'VH-204', litres: 120, cost_per_litre: 1.85, total_cost: 222,  date: '2026-07-11', odometer_km: 45200 },
  { id: 2, vehicle_reg: 'VH-109', litres: 80,  cost_per_litre: 1.85, total_cost: 148,  date: '2026-07-11', odometer_km: 28900 },
  { id: 3, vehicle_reg: 'VH-315', litres: 200, cost_per_litre: 1.85, total_cost: 370,  date: '2026-07-10', odometer_km: 62100 },
];

export const mockExpenses = [
  { id: 1, type: 'toll',  description: 'Highway N4', amount: 45,  date: '2026-07-11', trip_id: 'TRP-002' },
  { id: 2, type: 'misc',  description: 'Parking fee', amount: 20, date: '2026-07-10', trip_id: 'TRP-001' },
];

export const mockTotalCost = {
  fuel_total: 740,
  maintenance_total: 5340,
  expense_total: 65,
  grand_total: 6145,
};

export const mockReports = {
  kpis: {
    fuel_efficiency_km_per_litre: 4.8,
    fleet_utilization_pct: 71,
    operational_cost: 6145,
    vehicle_roi_pct: 18.4,
  },
  monthly_revenue: [
    { month: 'Jan', revenue: 48000 },
    { month: 'Feb', revenue: 52000 },
    { month: 'Mar', revenue: 61000 },
    { month: 'Apr', revenue: 57000 },
    { month: 'May', revenue: 63000 },
    { month: 'Jun', revenue: 70000 },
    { month: 'Jul', revenue: 38000 },
  ],
  costliest_vehicles: [
    { vehicle_reg: 'VH-207', total_cost: 4200 },
    { vehicle_reg: 'VH-315', total_cost: 960  },
    { vehicle_reg: 'VH-204', total_cost: 222  },
    { vehicle_reg: 'VH-109', total_cost: 148  },
  ],
};

export const mockSettings = {
  depot_name: 'TransitOps HQ',
  currency: 'USD',
  distance_unit: 'km',
};
