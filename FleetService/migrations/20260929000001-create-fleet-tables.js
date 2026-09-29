"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    // ═══════════ vehicle_types ═══════════
    await queryInterface.createTable("vehicle_types", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      type_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      capacity_seated: { type: DataTypes.INTEGER, allowNull: false },
      capacity_standing: { type: DataTypes.INTEGER, defaultValue: 0 },
      is_accessible: { type: DataTypes.BOOLEAN, defaultValue: false },
    });

    // ═══════════ employees ═══════════
    await queryInterface.createTable("employees", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      employee_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      full_name: { type: DataTypes.STRING(150), allowNull: false },
      phone: { type: DataTypes.STRING(20) },
      email: { type: DataTypes.STRING(150) },
      type: {
        type: DataTypes.ENUM(
          "driver",
          "co_driver",
          "depot_staff",
          "dispatcher",
        ),
        allowNull: false,
      },
      license_number: { type: DataTypes.STRING(50) },
      license_class: { type: DataTypes.STRING(10) },
      license_expiry: { type: DataTypes.DATEONLY },
      hire_date: { type: DataTypes.DATEONLY },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      user_id: { type: DataTypes.INTEGER, allowNull: true },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("employees", ["type"]);
    await queryInterface.addIndex("employees", ["is_active"]);

    // ═══════════ vehicles ═══════════
    await queryInterface.createTable("vehicles", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      vehicle_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      license_plate: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      vehicle_type_id: {
        type: DataTypes.INTEGER,
        references: { model: "vehicle_types", key: "id" },
        onDelete: "SET NULL",
      },
      capacity_seated: { type: DataTypes.INTEGER },
      capacity_standing: { type: DataTypes.INTEGER },
      battery_capacity_kwh: { type: DataTypes.DECIMAL(6, 2) },
      range_km: { type: DataTypes.INTEGER },
      depot_id: { type: DataTypes.INTEGER, allowNull: true }, // ref RouteService.stops
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("vehicles", ["depot_id"]);
    await queryInterface.addIndex("vehicles", ["is_active"]);

    // ═══════════ shift_templates ═══════════
    await queryInterface.createTable("shift_templates", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      prep_start: { type: DataTypes.TIME, allowNull: false },
      prep_end: { type: DataTypes.TIME, allowNull: false },
      drive_start: { type: DataTypes.TIME, allowNull: false },
      drive_end: { type: DataTypes.TIME, allowNull: false },
      handover_start: { type: DataTypes.TIME },
      handover_end: { type: DataTypes.TIME },
      buffer_minutes: { type: DataTypes.INTEGER, defaultValue: 45 },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    });

    // ═══════════ rosters ═══════════
    await queryInterface.createTable("rosters", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      employee_id: {
        type: DataTypes.INTEGER,
        references: { model: "employees", key: "id" },
        onDelete: "CASCADE",
      },
      shift_template_id: {
        type: DataTypes.INTEGER,
        references: { model: "shift_templates", key: "id" },
      },
      depot_id: { type: DataTypes.INTEGER },
      is_backup: { type: DataTypes.BOOLEAN, defaultValue: false },
      status: {
        type: DataTypes.ENUM(
          "scheduled",
          "working",
          "completed",
          "swapped",
          "absent",
          "off",
        ),
        defaultValue: "scheduled",
      },
      notes: { type: DataTypes.TEXT },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("rosters", ["date"]);
    await queryInterface.addIndex("rosters", ["employee_id", "date"], {
      unique: true,
    });

    // ═══════════ duty_assignments ═══════════
    await queryInterface.createTable("duty_assignments", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      shift_template_id: {
        type: DataTypes.INTEGER,
        references: { model: "shift_templates", key: "id" },
      },
      employee_id: {
        type: DataTypes.INTEGER,
        references: { model: "employees", key: "id" },
      },
      co_driver_id: {
        type: DataTypes.INTEGER,
        references: { model: "employees", key: "id" },
        allowNull: true,
      },
      vehicle_id: {
        type: DataTypes.INTEGER,
        references: { model: "vehicles", key: "id" },
      },
      route_id: { type: DataTypes.INTEGER, allowNull: false }, // external → RouteService
      depot_id: { type: DataTypes.INTEGER },
      start_time: { type: DataTypes.TIME, allowNull: false },
      end_time: { type: DataTypes.TIME, allowNull: false },
      buffer_minutes: { type: DataTypes.INTEGER, defaultValue: 45 },
      status: {
        type: DataTypes.ENUM(
          "scheduled",
          "in_progress",
          "completed",
          "cancelled",
          "swapped",
        ),
        defaultValue: "scheduled",
      },
      notes: { type: DataTypes.TEXT },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("duty_assignments", ["date"]);
    await queryInterface.addIndex("duty_assignments", ["employee_id", "date"]);
    await queryInterface.addIndex("duty_assignments", ["vehicle_id", "date"]);

    // ═══════════ incidents ═══════════
    await queryInterface.createTable("incidents", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      incident_code: { type: DataTypes.STRING(50), unique: true },
      trip_id: { type: DataTypes.INTEGER }, // external
      route_id: { type: DataTypes.INTEGER },
      vehicle_id: { type: DataTypes.INTEGER },
      driver_id: { type: DataTypes.INTEGER },
      type: {
        type: DataTypes.ENUM(
          "accident",
          "traffic_jam",
          "breakdown",
          "passenger_emergency",
          "other",
        ),
        allowNull: false,
      },
      severity: {
        type: DataTypes.ENUM("low", "medium", "high", "critical"),
        defaultValue: "medium",
      },
      description: { type: DataTypes.TEXT },
      latitude: { type: DataTypes.DECIMAL(10, 7) },
      longitude: { type: DataTypes.DECIMAL(10, 7) },
      status: {
        type: DataTypes.ENUM("reported", "acknowledged", "resolved", "closed"),
        defaultValue: "reported",
      },
      admin_action: {
        type: DataTypes.ENUM(
          "none",
          "reroute",
          "cancel_trip",
          "substitute_vehicle",
        ),
        defaultValue: "none",
      },
      admin_action_notes: { type: DataTypes.TEXT },
      affects_otp: { type: DataTypes.BOOLEAN, defaultValue: true },
      reported_by: { type: DataTypes.INTEGER },
      acknowledged_by: { type: DataTypes.INTEGER },
      acknowledged_at: { type: DataTypes.DATE },
      resolved_at: { type: DataTypes.DATE },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("incidents", ["status"]);
    await queryInterface.addIndex("incidents", ["trip_id"]);
    await queryInterface.addIndex("incidents", ["created_at"]);

    // ═══════════ incident_actions ═══════════
    await queryInterface.createTable("incident_actions", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      incident_id: {
        type: DataTypes.INTEGER,
        references: { model: "incidents", key: "id" },
        onDelete: "CASCADE",
      },
      action_type: {
        type: DataTypes.ENUM("call", "reroute", "substitute", "cancel", "note"),
        allowNull: false,
      },
      performed_by: { type: DataTypes.INTEGER },
      notes: { type: DataTypes.TEXT },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("incident_actions", ["incident_id"]);

    // ═══════════ shift_swap_requests ═══════════
    await queryInterface.createTable("shift_swap_requests", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      original_employee_id: { type: DataTypes.INTEGER, allowNull: false },
      substitute_employee_id: { type: DataTypes.INTEGER, allowNull: false },
      duty_assignment_id: { type: DataTypes.INTEGER, allowNull: false },
      swap_date: { type: DataTypes.DATEONLY, allowNull: false },
      reason: { type: DataTypes.TEXT },
      requested_by: { type: DataTypes.INTEGER },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected", "completed"),
        defaultValue: "pending",
      },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      completed_at: { type: DataTypes.DATE },
    });
    await queryInterface.addIndex("shift_swap_requests", [
      "duty_assignment_id",
    ]);

    // ═══════════ driver_unavailability ═══════════
    await queryInterface.createTable("driver_unavailability", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      driver_id: { type: DataTypes.INTEGER, allowNull: false },
      date_from: { type: DataTypes.DATEONLY, allowNull: false },
      date_to: { type: DataTypes.DATEONLY, allowNull: false },
      type: {
        type: DataTypes.ENUM(
          "sick",
          "personal",
          "vacation",
          "training",
          "suspended",
        ),
        allowNull: false,
      },
      reason: { type: DataTypes.TEXT },
      reported_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("driver_unavailability", [
      "driver_id",
      "date_from",
      "date_to",
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("driver_unavailability");
    await queryInterface.dropTable("shift_swap_requests");
    await queryInterface.dropTable("incident_actions");
    await queryInterface.dropTable("incidents");
    await queryInterface.dropTable("duty_assignments");
    await queryInterface.dropTable("rosters");
    await queryInterface.dropTable("shift_templates");
    await queryInterface.dropTable("vehicles");
    await queryInterface.dropTable("employees");
    await queryInterface.dropTable("vehicle_types");
  },
};
