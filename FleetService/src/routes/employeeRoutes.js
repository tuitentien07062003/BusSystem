import express from "express";
import * as employeeController from "../controllers/employeeController.js";

const router = express.Router();

router.get("/stats", employeeController.stats);

router.get("/", employeeController.list);
router.post("/", employeeController.create);
router.get("/:id", employeeController.getById);
router.put("/:id", employeeController.update);
router.patch("/:id/status", employeeController.changeStatus);

export default router;
