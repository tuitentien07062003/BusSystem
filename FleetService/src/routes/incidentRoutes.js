import express from "express";
import * as c from "../controllers/incidentController.js";

const router = express.Router();

router.get("/active", c.active);
router.get("/by-date", c.byDate);
router.get("/stats", c.stats);

router.get("/", c.list);
router.post("/", c.create);
router.get("/:id", c.getById);

router.post("/:id/ack", c.acknowledge);
router.post("/:id/actions", c.addAction);
router.post("/:id/resolve", c.resolve);
router.post("/:id/close", c.close);

router.put("/:id", c.update);
router.delete("/:id", c.remove);

export default router;
