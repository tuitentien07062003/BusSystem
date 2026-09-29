import Agency from "./agencyModel.js";
import Route from "./routeModel.js";
import TripPattern from "./tripPatternModel.js";
import Shape from "./shapeModel.js";
import Stop from "./stopModel.js";
import StopTimePattern from "./stopTimePatternModel.js";
import Trip from "./tripModel.js";
import ServiceCalendar from "./serviceCalendarModel.js";
import RouteOperation from "./routeOperationModel.js";
import RouteStatsCache from "./routeStatsCacheModel.js";
import HeadwayConfig from "./headwayConfigModel.js";

// ═══════════════════════════════════════════════════════════════
// 1. agencies (1) ──< (N) routes
//    routes.agency_id → agencies.id
// ═══════════════════════════════════════════════════════════════
Agency.hasMany(Route, {
  foreignKey: "agency_id",
  as: "routes",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Route.belongsTo(Agency, {
  foreignKey: "agency_id",
  as: "agency",
});

// ═══════════════════════════════════════════════════════════════
// 2. routes (1) ──< (N) trip_patterns
//    trip_patterns.route_id → routes.id
// ═══════════════════════════════════════════════════════════════
Route.hasMany(TripPattern, {
  foreignKey: "route_id",
  as: "patterns",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
TripPattern.belongsTo(Route, {
  foreignKey: "route_id",
  as: "route",
});

// ═══════════════════════════════════════════════════════════════
// 3. trip_patterns (1) ──< (N) stop_time_patterns
//    stop_time_patterns.trip_pattern_id → trip_patterns.id
// ═══════════════════════════════════════════════════════════════
TripPattern.hasMany(StopTimePattern, {
  foreignKey: "trip_pattern_id",
  as: "stop_times",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
StopTimePattern.belongsTo(TripPattern, {
  foreignKey: "trip_pattern_id",
  as: "pattern",
});

// ═══════════════════════════════════════════════════════════════
// 4. stops (1) ──< (N) stop_time_patterns
//    stop_time_patterns.stop_id → stops.id
// ═══════════════════════════════════════════════════════════════
Stop.hasMany(StopTimePattern, {
  foreignKey: "stop_id",
  as: "stop_times",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
StopTimePattern.belongsTo(Stop, {
  foreignKey: "stop_id",
  as: "stop",
});

// ═══════════════════════════════════════════════════════════════
// 5. trip_patterns (1) ──< (N) trips
//    trips.trip_pattern_id → trip_patterns.id
// ═══════════════════════════════════════════════════════════════
TripPattern.hasMany(Trip, {
  foreignKey: "trip_pattern_id",
  as: "trips",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Trip.belongsTo(TripPattern, {
  foreignKey: "trip_pattern_id",
  as: "pattern",
});

// ═══════════════════════════════════════════════════════════════
// 6. service_calendars (1) ──< (N) trips
//    trips.service_id → service_calendars.id
// ═══════════════════════════════════════════════════════════════
ServiceCalendar.hasMany(Trip, {
  foreignKey: "service_id",
  as: "trips",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Trip.belongsTo(ServiceCalendar, {
  foreignKey: "service_id",
  as: "service",
});

// ═══════════════════════════════════════════════════════════════
// 7. trip_patterns.shape_id ↔ shapes.shape_id (String FK — KHÔNG PHẢI ID)
//    Đây là FK đặc biệt: shape_id là chuỗi (VD: "19_GO"), không phải số.
//    Sequelize cần chỉ rõ sourceKey & targetKey.
// ═══════════════════════════════════════════════════════════════
TripPattern.hasMany(Shape, {
  foreignKey: "shape_id", // khóa ngoại nằm ở bảng shapes
  sourceKey: "shape_id", // khóa nguồn ở trip_patterns
  as: "shape_points",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Shape.belongsTo(TripPattern, {
  foreignKey: "shape_id",
  targetKey: "shape_id",
  as: "pattern",
});

// ═══════════════════════════════════════════════════════════════
// 8. routes (1) ── (1) route_operations
//    route_operations.route_id → routes.id  (PK + FK)
// ═══════════════════════════════════════════════════════════════
Route.hasOne(RouteOperation, {
  foreignKey: "route_id",
  as: "operations",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
RouteOperation.belongsTo(Route, {
  foreignKey: "route_id",
  as: "route",
});

// ═══════════════════════════════════════════════════════════════
// 9. routes (1) ── (1) route_stats_cache
//    route_stats_cache.route_id → routes.id  (PK + FK)
// ═══════════════════════════════════════════════════════════════
Route.hasOne(RouteStatsCache, {
  foreignKey: "route_id",
  as: "stats_cache",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
RouteStatsCache.belongsTo(Route, {
  foreignKey: "route_id",
  as: "route",
});

// ═══════════════════════════════════════════════════════════════
// 10. routes (1) ──< (N) headway_configs
//     headway_configs.route_id → routes.id
// ═══════════════════════════════════════════════════════════════
Route.hasMany(HeadwayConfig, {
  foreignKey: "route_id",
  as: "headway_configs",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
HeadwayConfig.belongsTo(Route, {
  foreignKey: "route_id",
  as: "route",
});

// ═══════════════════════════════════════════════════════════════
// Export tất cả model (đã gắn association) để dùng lại ở service
// ═══════════════════════════════════════════════════════════════
export {
  Agency,
  Route,
  TripPattern,
  Shape,
  Stop,
  StopTimePattern,
  Trip,
  ServiceCalendar,
  RouteOperation,
  RouteStatsCache,
  HeadwayConfig,
};
