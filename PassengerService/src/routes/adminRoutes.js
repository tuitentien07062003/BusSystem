import express from "express";
import * as admin from "../controllers/adminController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/users", requireAuth, requireRole("ADMIN"), admin.listUsers);
router.patch(
  "/users/:id/status",
  requireAuth,
  requireRole("ADMIN"),
  admin.changeUserStatus,
);
router.post(
  "/users/:id/roles",
  requireAuth,
  requireRole("ADMIN"),
  admin.assignRole,
);
router.get(
  "/students",
  requireAuth,
  requireRole("ADMIN"),
  admin.listStudentVerifications,
);
router.patch(
  "/students/:id/verify",
  requireAuth,
  requireRole("ADMIN"),
  admin.verifyStudent,
);

router.get(
  "/feedbacks",
  requireAuth,
  requireRole("ADMIN"),
  admin.listFeedbacks,
);
router.patch(
  "/feedbacks/:id",
  requireAuth,
  requireRole("ADMIN"),
  admin.updateFeedbackStatus,
);

export default router;
