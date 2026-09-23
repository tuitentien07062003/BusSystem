import express from "express";
import * as c from "../controllers/tripPatternController.js";
import * as stc from "../controllers/stopTimePatternController.js";

const router = express.Router();

// ─── Static routes trước ───
router.get("/stats", c.stats);
router.get("/by-route/:routeId", c.byRoute);

// ─── Sub-resource: stop_times của pattern ───
router.get("/:patternId/stop-times", stc.byPattern);
router.put("/:patternId/stop-times", stc.bulkReplace);

// ─── CRUD ───
router.get("/", c.list);
router.post("/", c.create);
router.get("/:id/detail", c.getDetail);
router.get("/:id", c.getById);
router.put("/:id", c.update);
router.delete("/:id", c.remove);

export default router;
