import express from "express";
import * as c from "../controllers/driverUnavailabilityController.js";

const router = express.Router();

router.get("/check", c.check);
router.get("/check-range", c.checkRange);
router.get("/impact", c.impact);
router.get("/stats", c.stats);
router.get("/calendar", c.calendar);

router.get("/", c.list);
router.post("/", c.create);
router.get("/:id", c.getById);
router.put("/:id", c.update);
router.delete("/:id", c.remove);

export default router;
