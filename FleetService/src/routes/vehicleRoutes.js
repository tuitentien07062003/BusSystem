import express from "express";
import * as vehicleController from "../controllers/vehicleController.js";

const router = express.Router();

router.get("/stats", vehicleController.stats);

router.get("/types", vehicleController.listTypes);

router.get("/", vehicleController.list);
router.post("/", vehicleController.create);
router.get("/:id", vehicleController.getById);
router.put("/:id", vehicleController.update);
router.patch("/:id/status", vehicleController.changeStatus);

export default router;
