// src/routes/stopRoutes.js
import express from "express";
import * as stopController from "../controllers/stopController.js";
import * as overrideController from "../controllers/stopRoadOverrideController.js";

const router = express.Router();

// Lấy danh sách (phân trang)
router.get("/", stopController.getStops);

// Thống kê nhanh
router.get("/stats", stopController.getStats);

// Tìm kiếm theo tên
router.get("/search", stopController.searchStops);

// Lấy chi tiết
router.get("/:id", stopController.getStopById);

// Cập nhật thông tin
router.put("/:id", stopController.updateStop);

// Đổi trạng thái is_active
router.patch("/:id/status", stopController.changeStatus);

// Road override
router.get("/:id/nearby-roads", overrideController.getNearbyRoads);
router.get("/:id/override", overrideController.getOverride);
router.put("/:id/override", overrideController.setOverride);
router.delete("/:id/override", overrideController.removeOverride);

export default router;
