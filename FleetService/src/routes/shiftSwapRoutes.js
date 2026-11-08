import express from "express";
import * as c from "../controllers/shiftSwapController.js";

const router = express.Router();

router.get("/by-date", c.byDate);
router.get("/stats", c.stats);
router.post("/suggest", c.suggest);

router.get("/", c.list);
router.post("/", c.create);
router.get("/:id", c.getById);
router.delete("/:id", c.remove);

export default router;
