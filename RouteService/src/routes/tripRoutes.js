import express from "express";
import * as c from "../controllers/tripController.js";

const router = express.Router();
router.get("/", c.list);
router.post("/", c.create);
router.get("/by-route/:routeId", c.byRoute);
router.get("/:id", c.getById);
router.put("/:id", c.update);
router.patch("/:id/status", c.changeStatus);
export default router;
