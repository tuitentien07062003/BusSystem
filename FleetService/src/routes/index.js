import express from "express";

import employeeRoutes from "./employeeRoutes.js";
import vehicleRoutes from "./vehicleRoutes.js";
import shiftTemplateRoutes from "./shiftTemplateRoutes.js";
import rosterRoutes from "./rosterRoutes.js";
import dutyAssignmentRoutes from "./dutyAssignmentRoutes.js";
import incidentRoutes from "./incidentRoutes.js";
import shiftSwapRoutes from "./shiftSwapRoutes.js";
import driverUnavailabilityRoutes from "./driverUnavailabilityRoutes.js";
// import scheduleRoutes from './scheduleRoutes.js';
// ═══════════════════════════════════════════════════════════════

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "FleetService",
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

router.use("/employees", employeeRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/shift-templates", shiftTemplateRoutes);
router.use("/rosters", rosterRoutes);
router.use("/assignments", dutyAssignmentRoutes);
router.use("/incidents", incidentRoutes);
router.use("/swaps", shiftSwapRoutes);
router.use("/unavailability", driverUnavailabilityRoutes);
// router.use('/schedule', scheduleRoutes);

export default router;
