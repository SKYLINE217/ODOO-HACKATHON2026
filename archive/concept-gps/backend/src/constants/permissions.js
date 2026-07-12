/**
 * Permission matrix — direct implementation of access-control.md §2.
 * This is the backend source of truth for RBAC.
 *
 * Structure: PERMISSIONS[capability] = [roles that have access]
 *
 * access-control.md §4: if a new endpoint is added mid-hackathon,
 * update this matrix FIRST, then implement.
 */

const { ROLES } = require('./enums');

const PERMISSIONS = Object.freeze({
  // Dashboard & KPIs — all roles
  'view:dashboard': [ROLES.FLEET_MANAGER, ROLES.DRIVER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST],

  // Vehicles
  'view:vehicles': [ROLES.FLEET_MANAGER, ROLES.DRIVER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST],
  'create:vehicle': [ROLES.FLEET_MANAGER],
  'edit:vehicle': [ROLES.FLEET_MANAGER],
  'retire:vehicle': [ROLES.FLEET_MANAGER],
  'view:dispatch-pool-vehicles': [ROLES.FLEET_MANAGER, ROLES.DRIVER],

  // Drivers
  'view:drivers': [ROLES.FLEET_MANAGER, ROLES.DRIVER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST],
  'create:driver': [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER],
  'edit:driver': [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER],
  'suspend:driver': [ROLES.SAFETY_OFFICER],
  'view:dispatch-pool-drivers': [ROLES.FLEET_MANAGER, ROLES.DRIVER],

  // Trips
  'create:trip': [ROLES.FLEET_MANAGER, ROLES.DRIVER],
  'dispatch:trip': [ROLES.FLEET_MANAGER, ROLES.DRIVER],
  'complete:trip': [ROLES.FLEET_MANAGER, ROLES.DRIVER],
  'cancel:trip': [ROLES.FLEET_MANAGER, ROLES.DRIVER],

  // Maintenance
  'view:maintenance': [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST],
  'create:maintenance': [ROLES.FLEET_MANAGER],
  'close:maintenance': [ROLES.FLEET_MANAGER],

  // Fuel & Expenses
  'log:fuel': [ROLES.FLEET_MANAGER, ROLES.DRIVER],
  'log:expense': [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST],

  // Reports & Analytics
  'view:reports': [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST],

  // CSV Export
  'export:csv': [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST],
});

module.exports = { PERMISSIONS };
