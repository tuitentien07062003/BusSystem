"use strict";

export default {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    // ═══════════════════════════════════════════════════════════
    // 1. USERS
    // ═══════════════════════════════════════════════════════════
    await queryInterface.createTable("users", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      email: { type: DataTypes.STRING(150), unique: true },
      phone: { type: DataTypes.STRING(20), unique: true },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      full_name: { type: DataTypes.STRING(150), allowNull: false },
      avatar_url: { type: DataTypes.TEXT },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("users", ["username"]);
    await queryInterface.addIndex("users", ["phone"]);

    // ═══════════════════════════════════════════════════════════
    // 2. USER_ROLES
    // ═══════════════════════════════════════════════════════════
    await queryInterface.createTable("user_roles", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      role: {
        type: DataTypes.ENUM("PASSENGER", "ADMIN"),
        allowNull: false,
      },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("user_roles", ["user_id"]);
    await queryInterface.addIndex("user_roles", ["user_id", "role"], {
      unique: true,
    });

    // ═══════════════════════════════════════════════════════════
    // 3. REFRESH_TOKENS
    // ═══════════════════════════════════════════════════════════
    await queryInterface.createTable("refresh_tokens", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      token: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      revoked_at: { type: DataTypes.DATE },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("refresh_tokens", ["user_id"]);
    await queryInterface.addIndex("refresh_tokens", ["token"]);

    // ═══════════════════════════════════════════════════════════
    // 4. STUDENT_VERIFICATIONS
    // ═══════════════════════════════════════════════════════════
    await queryInterface.createTable("student_verifications", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      mssv: { type: DataTypes.STRING(20), allowNull: false },
      school: { type: DataTypes.STRING(150), allowNull: false },
      cccd: { type: DataTypes.STRING(20), allowNull: false },
      full_name: { type: DataTypes.STRING(150), allowNull: false },
      birth_year: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.ENUM("pending", "verified", "rejected"),
        defaultValue: "pending",
      },
      verified_by: { type: DataTypes.INTEGER },
      verified_at: { type: DataTypes.DATE },
      rejection_reason: { type: DataTypes.TEXT },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("student_verifications", ["user_id"]);
    await queryInterface.addIndex("student_verifications", ["status"]);
    await queryInterface.addIndex("student_verifications", ["mssv"]);

    // ═══════════════════════════════════════════════════════════
    // 5. FAVORITES
    // ═══════════════════════════════════════════════════════════
    await queryInterface.createTable("favorites", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      type: {
        type: DataTypes.ENUM("route", "stop"),
        allowNull: false,
      },
      target_id: { type: DataTypes.INTEGER, allowNull: false },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("favorites", ["user_id"]);
    await queryInterface.addIndex(
      "favorites",
      ["user_id", "type", "target_id"],
      {
        unique: true,
      },
    );

    // ═══════════════════════════════════════════════════════════
    // 6. SEARCH_HISTORY
    // ═══════════════════════════════════════════════════════════
    await queryInterface.createTable("search_history", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      from_text: { type: DataTypes.STRING(255) },
      to_text: { type: DataTypes.STRING(255) },
      from_stop_id: { type: DataTypes.INTEGER },
      to_stop_id: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("search_history", ["user_id"]);
    await queryInterface.addIndex("search_history", ["user_id", "created_at"]);

    // ═══════════════════════════════════════════════════════════
    // 7. TRIP_FEEDBACK
    // ═══════════════════════════════════════════════════════════
    await queryInterface.createTable("trip_feedback", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      trip_id: { type: DataTypes.INTEGER },
      route_id: { type: DataTypes.INTEGER },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 5 },
      },
      comment: { type: DataTypes.TEXT },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("trip_feedback", ["user_id"]);
    await queryInterface.addIndex("trip_feedback", ["route_id"]);
    await queryInterface.addIndex("trip_feedback", ["trip_id"]);

    // ═══════════════════════════════════════════════════════════
    // 8. TICKETS
    // ═══════════════════════════════════════════════════════════
    await queryInterface.createTable("tickets", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      ticket_type: {
        type: DataTypes.ENUM("single", "bundle", "monthly"),
        allowNull: false,
      },
      is_student: { type: DataTypes.BOOLEAN, defaultValue: false },
      qr_code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      price: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.ENUM("active", "used", "expired", "cancelled"),
        defaultValue: "active",
      },
      purchased_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      expires_at: { type: DataTypes.DATE },
      total_uses: { type: DataTypes.INTEGER, defaultValue: 1 },
      remaining_uses: { type: DataTypes.INTEGER, defaultValue: 1 },
      last_used_at: { type: DataTypes.DATE },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("tickets", ["user_id"]);
    await queryInterface.addIndex("tickets", ["qr_code"]);
    await queryInterface.addIndex("tickets", ["status"]);

    // ═══════════════════════════════════════════════════════════
    // 9. TICKET_USAGE_LOGS
    // ═══════════════════════════════════════════════════════════
    await queryInterface.createTable("ticket_usage_logs", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ticket_id: {
        type: DataTypes.INTEGER,
        references: { model: "tickets", key: "id" },
        onDelete: "CASCADE",
      },
      trip_id: { type: DataTypes.INTEGER },
      vehicle_id: { type: DataTypes.INTEGER },
      route_id: { type: DataTypes.INTEGER },
      scanned_by: { type: DataTypes.INTEGER },
      scanned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      location_lat: { type: DataTypes.DECIMAL(10, 7) },
      location_lng: { type: DataTypes.DECIMAL(10, 7) },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("ticket_usage_logs", ["ticket_id"]);
    await queryInterface.addIndex("ticket_usage_logs", ["scanned_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ticket_usage_logs");
    await queryInterface.dropTable("tickets");
    await queryInterface.dropTable("trip_feedback");
    await queryInterface.dropTable("search_history");
    await queryInterface.dropTable("favorites");
    await queryInterface.dropTable("student_verifications");
    await queryInterface.dropTable("refresh_tokens");
    await queryInterface.dropTable("user_roles");
    await queryInterface.dropTable("users");
  },
};
