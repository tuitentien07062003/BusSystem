import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// ═══════════════════════════════════════════════════════════════
// 1. USER
// ═══════════════════════════════════════════════════════════════
export const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(150), unique: true },
    phone: { type: DataTypes.STRING(20), unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    full_name: { type: DataTypes.STRING(150), allowNull: false },
    avatar_url: { type: DataTypes.TEXT },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE },
    updated_at: { type: DataTypes.DATE },
  },
  { tableName: "users", timestamps: false },
);

// ═══════════════════════════════════════════════════════════════
// 2. USER_ROLE
// ═══════════════════════════════════════════════════════════════
export const UserRole = sequelize.define(
  "UserRole",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    role: { type: DataTypes.ENUM("PASSENGER", "ADMIN"), allowNull: false },
    created_at: { type: DataTypes.DATE },
  },
  { tableName: "user_roles", timestamps: false },
);

// ═══════════════════════════════════════════════════════════════
// 3. REFRESH_TOKEN
// ═══════════════════════════════════════════════════════════════
export const RefreshToken = sequelize.define(
  "RefreshToken",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    token: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    revoked_at: { type: DataTypes.DATE },
    created_at: { type: DataTypes.DATE },
  },
  { tableName: "refresh_tokens", timestamps: false },
);

// ═══════════════════════════════════════════════════════════════
// 4. STUDENT_VERIFICATION
// ═══════════════════════════════════════════════════════════════
export const StudentVerification = sequelize.define(
  "StudentVerification",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    mssv: { type: DataTypes.STRING(20), allowNull: false },
    school: { type: DataTypes.STRING(150), allowNull: false },
    cccd: { type: DataTypes.STRING(20), allowNull: false },
    full_name: { type: DataTypes.STRING(150), allowNull: false },
    birth_year: { type: DataTypes.INTEGER, allowNull: false },
    enrollment_year: { type: DataTypes.INTEGER },
    graduation_year: { type: DataTypes.INTEGER },
    student_card_image: { type: DataTypes.TEXT },
    status: {
      type: DataTypes.ENUM("pending", "verified", "rejected"),
      defaultValue: "pending",
    },
    verified_by: { type: DataTypes.INTEGER },
    verified_at: { type: DataTypes.DATE },
    rejection_reason: { type: DataTypes.TEXT },
    created_at: { type: DataTypes.DATE },
  },
  { tableName: "student_verifications", timestamps: false },
);

// ═══════════════════════════════════════════════════════════════
// 5. FAVORITE
// ═══════════════════════════════════════════════════════════════
export const Favorite = sequelize.define(
  "Favorite",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM("route", "stop"), allowNull: false },
    target_id: { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.DATE },
  },
  { tableName: "favorites", timestamps: false },
);

// ═══════════════════════════════════════════════════════════════
// 6. SEARCH_HISTORY
// ═══════════════════════════════════════════════════════════════
export const SearchHistory = sequelize.define(
  "SearchHistory",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    from_text: { type: DataTypes.STRING(255) },
    to_text: { type: DataTypes.STRING(255) },
    from_stop_id: { type: DataTypes.INTEGER },
    to_stop_id: { type: DataTypes.INTEGER },
    created_at: { type: DataTypes.DATE },
  },
  { tableName: "search_history", timestamps: false },
);

// ═══════════════════════════════════════════════════════════════
// 7. TRIP_FEEDBACK
// ═══════════════════════════════════════════════════════════════
export const TripFeedback = sequelize.define(
  "TripFeedback",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    trip_id: { type: DataTypes.INTEGER, allowNull: true },
    route_id: { type: DataTypes.INTEGER, allowNull: true },
    rating: { type: DataTypes.INTEGER, allowNull: true },

    type: {
      type: DataTypes.ENUM("trip", "general"),
      defaultValue: "general",
    },
    full_name: { type: DataTypes.STRING(150), allowNull: true },
    email: { type: DataTypes.STRING(150), allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    comment: { type: DataTypes.TEXT, allowNull: true },
    images: { type: DataTypes.JSONB, defaultValue: [] },
    status: {
      type: DataTypes.ENUM("new", "reviewed", "resolved"),
      defaultValue: "new",
    },
    admin_note: { type: DataTypes.TEXT, allowNull: true },
    reviewed_by: { type: DataTypes.INTEGER, allowNull: true },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },

    created_at: { type: DataTypes.DATE },
  },
  { tableName: "trip_feedback", timestamps: false },
);

// ═══════════════════════════════════════════════════════════════
// 8. TICKET
// ═══════════════════════════════════════════════════════════════
export const Ticket = sequelize.define(
  "Ticket",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    ticket_type: {
      type: DataTypes.ENUM("single", "bundle", "monthly"),
      allowNull: false,
    },
    is_student: { type: DataTypes.BOOLEAN, defaultValue: false },
    qr_code: { type: DataTypes.STRING(100), allowNull: true, unique: true },
    price: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("active", "used", "expired", "cancelled"),
      defaultValue: "active",
    },
    purchased_at: { type: DataTypes.DATE },
    expires_at: { type: DataTypes.DATE },
    total_uses: { type: DataTypes.INTEGER, defaultValue: 1 },
    remaining_uses: { type: DataTypes.INTEGER, defaultValue: 1 },
    last_used_at: { type: DataTypes.DATE },
    created_at: { type: DataTypes.DATE },
    payment_status: {
      type: DataTypes.STRING(20),
      defaultValue: "paid",
      validate: { isIn: [["pending", "paid", "failed", "cancelled"]] },
    },
    payment_method: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: { isIn: [["momo", "zalopay", "payos", "cash"]] },
    },
    payos_order_code: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    payment_ref: { type: DataTypes.STRING(100), allowNull: true },
    paid_at: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "tickets", timestamps: false },
);

// ═══════════════════════════════════════════════════════════════
// 9. TICKET_USAGE_LOG
// ═══════════════════════════════════════════════════════════════
export const TicketUsageLog = sequelize.define(
  "TicketUsageLog",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ticket_id: { type: DataTypes.INTEGER, allowNull: false },
    trip_id: { type: DataTypes.INTEGER },
    vehicle_id: { type: DataTypes.INTEGER },
    route_id: { type: DataTypes.INTEGER },
    scanned_by: { type: DataTypes.INTEGER },
    scanned_at: { type: DataTypes.DATE },
    location_lat: { type: DataTypes.DECIMAL(10, 7) },
    location_lng: { type: DataTypes.DECIMAL(10, 7) },
    created_at: { type: DataTypes.DATE },
  },
  { tableName: "ticket_usage_logs", timestamps: false },
);

// ═══════════════════════════════════════════════════════════════
// ASSOCIATIONS
// ═══════════════════════════════════════════════════════════════

// User ↔ Roles
User.hasMany(UserRole, {
  foreignKey: "user_id",
  as: "roles",
  onDelete: "CASCADE",
});
UserRole.belongsTo(User, { foreignKey: "user_id", as: "user" });

// User ↔ RefreshTokens
User.hasMany(RefreshToken, {
  foreignKey: "user_id",
  as: "refresh_tokens",
  onDelete: "CASCADE",
});
RefreshToken.belongsTo(User, { foreignKey: "user_id", as: "user" });

// User ↔ StudentVerification
User.hasOne(StudentVerification, {
  foreignKey: "user_id",
  as: "student_verification",
  onDelete: "CASCADE",
});
StudentVerification.belongsTo(User, { foreignKey: "user_id", as: "user" });

// User ↔ Favorites
User.hasMany(Favorite, {
  foreignKey: "user_id",
  as: "favorites",
  onDelete: "CASCADE",
});
Favorite.belongsTo(User, { foreignKey: "user_id", as: "user" });

// User ↔ SearchHistory
User.hasMany(SearchHistory, {
  foreignKey: "user_id",
  as: "search_history",
  onDelete: "CASCADE",
});
SearchHistory.belongsTo(User, { foreignKey: "user_id", as: "user" });

// User ↔ TripFeedback
User.hasMany(TripFeedback, {
  foreignKey: "user_id",
  as: "feedbacks",
  onDelete: "CASCADE",
});
TripFeedback.belongsTo(User, { foreignKey: "user_id", as: "user" });

// User ↔ Tickets
User.hasMany(Ticket, {
  foreignKey: "user_id",
  as: "tickets",
  onDelete: "CASCADE",
});
Ticket.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Ticket ↔ UsageLogs
Ticket.hasMany(TicketUsageLog, {
  foreignKey: "ticket_id",
  as: "usage_logs",
  onDelete: "CASCADE",
});
TicketUsageLog.belongsTo(Ticket, { foreignKey: "ticket_id", as: "ticket" });
