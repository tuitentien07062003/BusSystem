import express from "express";
import * as statsController from "../controllers/statsController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("ADMIN"));

router.get("/overview", statsController.overview);
router.get("/revenue", statsController.revenue);
router.get("/tickets", statsController.tickets);
router.get("/feedbacks", statsController.feedbacks);
router.get("/recent", statsController.recent);

export default router;
