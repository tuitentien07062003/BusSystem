import express from "express";
import * as routeController from "../controllers/routeController.js";
import * as composerController from "../controllers/routeComposerController.js";
import * as opController from "../controllers/routeOperationController.js";
import * as headwayController from "../controllers/headwayConfigController.js";

const router = express.Router();

// ─── Composer ───
router.get("/composer/depots", composerController.getDepots);
router.get("/composer/stops/search", composerController.searchStops);
router.get("/composer/stops/by-ids", composerController.getStopsByIds);
router.post("/composer/match-stops", composerController.matchStops);
router.post("/composer/preview", composerController.preview);
router.post("/composer/save", composerController.save);
router.delete("/composer/:id", composerController.remove);

// ═══════════════════════════════════════════════════════════════
// ROUTE OPERATIONS — vận hành tuyến
// ═══════════════════════════════════════════════════════════════

// Kích hoạt / hủy kích hoạt
router.post("/:id/activate", opController.activate);
router.delete("/:id/operations", opController.deactivate);
// Metadata vận hành
router.get("/:id/operations", opController.getOperations);
router.put("/:id/operations", opController.updateOperations);
// Số liệu tuyến
router.get("/:id/stats", opController.getStatsByDate);
router.post("/:id/recompute-stats", opController.recomputeStats);
// Sinh chuyến
router.post("/:id/trips/preview", opController.previewTrips);
router.post("/:id/generate-trips", opController.generateTrips);
router.post("/:id/regenerate-trips", opController.regenerateTrips);

// ═══════════════════════════════════════════════════════════════
// HEADWAY CONFIGS — cấu hình khung giờ
// ═══════════════════════════════════════════════════════════════
router.get("/:id/headway-configs", headwayController.getConfigs);
router.put("/:id/headway-configs", headwayController.replaceConfigs);
router.delete("/:id/headway-configs", headwayController.clearConfigs);
router.get("/:id/headway-configs/preset", headwayController.getPreset);
router.post("/:id/headway-configs/validate", headwayController.validateConfigs);

// ─── CRUD ───
router.get("/stats", routeController.getStats);
router.get("/", routeController.getRoutes);
router.post("/", routeController.create);
router.get("/:id/full", routeController.getFull);
router.get("/:id", routeController.getById);
router.put("/:id", routeController.update);
router.patch("/:id/status", routeController.changeStatus);

export default router;
