import express from "express";
import * as c from "../controllers/stopTimePatternController.js";

const router = express.Router();

router.get("/stats", c.stats);
router.get("/", c.list);
router.post("/", c.create);
router.get("/:id", c.getById);
router.put("/:id", c.update);
router.delete("/:id", c.remove);

export default router;
