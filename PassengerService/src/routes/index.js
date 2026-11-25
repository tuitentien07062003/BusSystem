import express from "express";
import authRoutes from "./authRoutes.js";
import adminRoutes from "./adminRoutes.js";
import passengerRoutes from "./passengerRoutes.js";
import discoveryRoutes from "./discoveryRoutes.js";
import adminStatsRoutes from "./adminStatsRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/admin/stats", adminStatsRoutes);
router.use("/discovery", discoveryRoutes);
router.use("/", passengerRoutes);

export default router;
