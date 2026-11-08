import VehicleType from "./vehicleTypeModel.js";
import Vehicle from "./vehicleModel.js";
import Employee from "./employeeModel.js";
import ShiftTemplate from "./shiftTemplateModel.js";
import Roster from "./rosterModel.js";
import DutyAssignment from "./dutyAssignmentModel.js";
import Incident from "./incidentModel.js";
import IncidentAction from "./incidentActionModel.js";
import ShiftSwap from "./shiftSwapModel.js";
import DriverUnavailability from "./driverUnavailabilityModel.js";

// ═══════════════════════════════════════════════════════════════
// 1. vehicle_types (1) ──< (N) vehicles
//    vehicles.vehicle_type_id → vehicle_types.id
// ═══════════════════════════════════════════════════════════════
VehicleType.hasMany(Vehicle, {
  foreignKey: "vehicle_type_id",
  as: "vehicles",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Vehicle.belongsTo(VehicleType, {
  foreignKey: "vehicle_type_id",
  as: "type",
});

// ═══════════════════════════════════════════════════════════════
// 2. employees (1) ──< (N) duty_assignments  (driver)
//    duty_assignments.employee_id → employees.id
// ═══════════════════════════════════════════════════════════════
Employee.hasMany(DutyAssignment, {
  foreignKey: "employee_id",
  as: "assignments",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
DutyAssignment.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "driver",
});

// ═══════════════════════════════════════════════════════════════
// 3. employees (1) ──< (N) duty_assignments  (co_driver)
//    duty_assignments.co_driver_id → employees.id
// ═══════════════════════════════════════════════════════════════
Employee.hasMany(DutyAssignment, {
  foreignKey: "co_driver_id",
  as: "co_driver_assignments",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
DutyAssignment.belongsTo(Employee, {
  foreignKey: "co_driver_id",
  as: "co_driver",
});

// ═══════════════════════════════════════════════════════════════
// 4. vehicles (1) ──< (N) duty_assignments
//    duty_assignments.vehicle_id → vehicles.id
// ═══════════════════════════════════════════════════════════════
Vehicle.hasMany(DutyAssignment, {
  foreignKey: "vehicle_id",
  as: "assignments",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
DutyAssignment.belongsTo(Vehicle, {
  foreignKey: "vehicle_id",
  as: "vehicle",
});

// ═══════════════════════════════════════════════════════════════
// 5. shift_templates (1) ──< (N) duty_assignments
//    duty_assignments.shift_template_id → shift_templates.id
// ═══════════════════════════════════════════════════════════════
ShiftTemplate.hasMany(DutyAssignment, {
  foreignKey: "shift_template_id",
  as: "assignments",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
DutyAssignment.belongsTo(ShiftTemplate, {
  foreignKey: "shift_template_id",
  as: "shift",
});

// ═══════════════════════════════════════════════════════════════
// 6. employees (1) ──< (N) rosters
//    rosters.employee_id → employees.id
// ═══════════════════════════════════════════════════════════════
Employee.hasMany(Roster, {
  foreignKey: "employee_id",
  as: "rosters",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Roster.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});

// ═══════════════════════════════════════════════════════════════
// 7. shift_templates (1) ──< (N) rosters
//    rosters.shift_template_id → shift_templates.id
// ═══════════════════════════════════════════════════════════════
ShiftTemplate.hasMany(Roster, {
  foreignKey: "shift_template_id",
  as: "rosters",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Roster.belongsTo(ShiftTemplate, {
  foreignKey: "shift_template_id",
  as: "shift",
});

// ═══════════════════════════════════════════════════════════════
// 8. incidents (1) ──< (N) incident_actions
//    incident_actions.incident_id → incidents.id
// ═══════════════════════════════════════════════════════════════
Incident.hasMany(IncidentAction, {
  foreignKey: "incident_id",
  as: "actions",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
IncidentAction.belongsTo(Incident, {
  foreignKey: "incident_id",
  as: "incident",
});

// ═══════════════════════════════════════════════════════════════
// 9. incidents → vehicle / driver / route (soft refs, no FK enforced)
//    Chỉ define ở đây để service có thể include nếu cần
// ═══════════════════════════════════════════════════════════════
Incident.belongsTo(Vehicle, {
  foreignKey: "vehicle_id",
  as: "vehicle",
  constraints: false,
});
Incident.belongsTo(Employee, {
  foreignKey: "driver_id",
  as: "driver",
  constraints: false,
});

// ═══════════════════════════════════════════════════════════════
// 10. duty_assignments (1) ──< (N) shift_swap_requests
//     shift_swap_requests.duty_assignment_id → duty_assignments.id
// ═══════════════════════════════════════════════════════════════
DutyAssignment.hasMany(ShiftSwap, {
  foreignKey: "duty_assignment_id",
  as: "swaps",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
ShiftSwap.belongsTo(DutyAssignment, {
  foreignKey: "duty_assignment_id",
  as: "assignment",
});

// ═══════════════════════════════════════════════════════════════
// 11. shift_swap_requests → employees (original + substitute)
// ═══════════════════════════════════════════════════════════════
ShiftSwap.belongsTo(Employee, {
  foreignKey: "original_employee_id",
  as: "original_employee",
  constraints: false,
});
ShiftSwap.belongsTo(Employee, {
  foreignKey: "substitute_employee_id",
  as: "substitute_employee",
  constraints: false,
});

// ═══════════════════════════════════════════════════════════════
// 12. employees (1) ──< (N) driver_unavailability
//     driver_unavailability.driver_id → employees.id
// ═══════════════════════════════════════════════════════════════
Employee.hasMany(DriverUnavailability, {
  foreignKey: "driver_id",
  as: "unavailability",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
DriverUnavailability.belongsTo(Employee, {
  foreignKey: "driver_id",
  as: "driver",
});

// ═══════════════════════════════════════════════════════════════
// Export tất cả model (đã gắn association) để service dùng lại
// ═══════════════════════════════════════════════════════════════
export {
  VehicleType,
  Vehicle,
  Employee,
  ShiftTemplate,
  Roster,
  DutyAssignment,
  Incident,
  IncidentAction,
  ShiftSwap,
  DriverUnavailability,
};
