import express from "express";
import * as c from "../controllers/dutyAssignmentController.js";

const router = express.Router();

router.get("/by-date", c.byDate);
router.get("/stats", c.stats);
router.post("/suggest", c.suggest);
router.post("/bulk", c.bulkCreate);

router.get("/", c.list);
router.post("/", c.create);
router.get("/:id", c.getById);
router.put("/:id", c.update);
router.patch("/:id/status", c.changeStatus);
router.delete("/:id", c.remove);

export default router;
