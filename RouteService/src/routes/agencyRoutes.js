// src/routes/agencyRoutes.js
import express from "express";
import * as agencyController from "../controllers/agencyController.js";

const router = express.Router();

// ─── Thứ tự route RẤT quan trọng: route tĩnh đặt trước route động ───

// Thống kê
router.get("/stats", agencyController.getStats);

// Danh sách (phân trang + lọc + tìm kiếm)
router.get("/", agencyController.getAgencies);

// Tạo mới
router.post("/", agencyController.createAgency);

// Chi tiết
router.get("/:id", agencyController.getAgencyById);

// Cập nhật
router.put("/:id", agencyController.updateAgency);

// Đổi trạng thái is_active (thay cho DELETE)
router.patch("/:id/status", agencyController.changeStatus);

export default router;
