import express from "express";
import * as c from "../controllers/shiftTemplateController.js";

const router = express.Router();

router.get("/active", c.listActive);
router.post("/validate", c.validate);

router.get("/", c.list);
router.post("/", c.create);
router.get("/:id", c.getById);
router.get("/:id/usage-stats", c.usageStats);
router.get("/:id/impact", c.impact);
router.put("/:id", c.update);
router.patch("/:id/status", c.changeStatus);

export default router;
