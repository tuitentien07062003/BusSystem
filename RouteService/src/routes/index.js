import express from "express";
import stopRoutes from "./stopRoutes.js";
import agencyRoutes from "./agencyRoutes.js";
import routeRoutes from "./routeRoutes.js";
import serviceCalendarRoutes from "./serviceCalendarRoutes.js";
import tripRoutes from "./tripRoutes.js";
import tripPatternRoutes from "./tripPatternRoutes.js";
import stopTimePatternRoutes from "./stopTimePatternRoutes.js";

const router = express.Router();

router.use("/stops", stopRoutes);
router.use("/agencies", agencyRoutes);
router.use("/routes", routeRoutes);
router.use("/service-calendars", serviceCalendarRoutes);
router.use("/trips", tripRoutes);
router.use("/trip-patterns", tripPatternRoutes);
router.use("/stop-time-patterns", stopTimePatternRoutes);

export default router;
