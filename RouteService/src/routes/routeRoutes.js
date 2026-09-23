import express from "express";
import * as routeController from "../controllers/routeController.js";
import * as composerController from "../controllers/routeComposerController.js";

const router = express.Router();

// ─── Composer ───
router.get("/composer/depots", composerController.getDepots);
router.get("/composer/stops/search", composerController.searchStops);
router.get("/composer/stops/by-ids", composerController.getStopsByIds);
router.post("/composer/match-stops", composerController.matchStops);
router.post("/composer/preview", composerController.preview);
router.post("/composer/save", composerController.save);
router.delete("/composer/:id", composerController.remove);

// ─── CRUD ───
router.get("/stats", routeController.getStats);
router.get("/", routeController.getRoutes);
router.post("/", routeController.create);
router.get("/:id/full", routeController.getFull);
router.get("/:id", routeController.getById);
router.put("/:id", routeController.update);
router.patch("/:id/status", routeController.changeStatus);

export default router;
