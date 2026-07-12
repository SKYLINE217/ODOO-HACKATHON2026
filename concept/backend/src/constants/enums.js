/**
 * Canonical enums — single source of truth.
 * database.md §0: used verbatim everywhere (DB, API, frontend).
 * Always lowercase snake_case — never "Available" or "AVAILABLE".
 */

const ROLES = Object.freeze({
  FLEET_MANAGER: 'fleet_manager',
  DRIVER: 'driver',
  SAFETY_OFFICER: 'safety_officer',
  FINANCIAL_ANALYST: 'financial_analyst',
});

const VALID_ROLES = Object.freeze(Object.values(ROLES));

const VEHICLE_STATUS = Object.freeze({
  AVAILABLE: 'available',
  ON_TRIP: 'on_trip',
  IN_SHOP: 'in_shop',
  RETIRED: 'retired',
});

const DRIVER_STATUS = Object.freeze({
  AVAILABLE: 'available',
  ON_TRIP: 'on_trip',
  OFF_DUTY: 'off_duty',
  SUSPENDED: 'suspended',
});

const TRIP_STATUS = Object.freeze({
  DRAFT: 'draft',
  DISPATCHED: 'dispatched',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

const MAINTENANCE_STATUS = Object.freeze({
  ACTIVE: 'active',
  CLOSED: 'closed',
});

const EXPENSE_TYPE = Object.freeze({
  TOLL: 'toll',
  MAINTENANCE: 'maintenance',
  OTHER: 'other',
});

module.exports = {
  ROLES, VALID_ROLES,
  VEHICLE_STATUS, DRIVER_STATUS, TRIP_STATUS,
  MAINTENANCE_STATUS, EXPENSE_TYPE,
};
