import express from "express";
import * as auth from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", auth.register);
router.post("/login", auth.login);
router.post("/refresh", auth.refresh);
router.post("/logout", auth.logout);
router.get("/me", requireAuth, auth.getMe);
router.put("/me", requireAuth, auth.updateMe);
router.post("/change-password", requireAuth, auth.changePassword);

export default router;
