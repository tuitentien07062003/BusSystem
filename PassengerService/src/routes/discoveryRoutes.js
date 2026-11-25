import express from "express";
import * as c from "../controllers/discoveryController.js";

const router = express.Router();

router.get("/stops/nearby", c.nearbyStops);
router.get("/routes/search", c.searchDirect);
router.get("/routes/transfer", c.searchTransfer);
router.get("/map/network", c.mapNetwork);
router.get("/stops/all", c.allStops);

router.get("/stops/:id/routes", c.routesByStop);
router.get("/routes/:id", c.routeDetail);
router.get("/routes/:id/schedule", c.routeSchedule);
router.get("/routes/:id/trips", c.routeTrips);

router.post("/chat", c.chat);

export default router;
