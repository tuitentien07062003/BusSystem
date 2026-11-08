import express from "express";
import * as c from "../controllers/rosterController.js";

const router = express.Router();

// ═══════════════════════════════════════════════════════════════
// Static routes PHẢI đặt trước dynamic /:id
// ═══════════════════════════════════════════════════════════════

// Bulk
router.post("/preview", c.previewBulk);
router.post("/bulk", c.bulkCreate);

// Views
router.get("/calendar", c.calendar);
router.get("/coverage", c.coverage);
router.get("/stats", c.stats);
router.get("/suggest-pattern", c.suggestPattern);
router.get("/by-employee/:id", c.byEmployee);

// CRUD
router.get("/", c.list);
router.post("/", c.create);
router.get("/:id", c.getById);
router.put("/:id", c.update);
router.patch("/:id/status", c.changeStatus);
router.delete("/:id", c.remove);

export default router;
