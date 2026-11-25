import express from "express";
import * as pc from "../controllers/passengerController.js";
import * as tc from "../controllers/ticketController.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// ─── Ping ───
router.get("/ping", (req, res) => res.json({ ok: true }));

// ─── Favorites ───
router.get("/me/favorites", requireAuth, pc.listFavorites);
router.post("/me/favorites", requireAuth, pc.addFavorite);
router.delete("/me/favorites/:id", requireAuth, pc.removeFavorite);

// ─── Search History ───
router.get("/me/search-history", requireAuth, pc.listSearchHistory);
router.post("/me/search-history", requireAuth, pc.addSearchHistory);
router.delete("/me/search-history", requireAuth, pc.clearSearchHistory);

// ─── Feedback ───
router.post("/feedbacks", optionalAuth, pc.submitFeedback);

// ─── Student Verification ───
router.post("/me/students/verify", requireAuth, tc.submitStudentVerify);
router.get("/me/students/verify", requireAuth, tc.getMyStudentVerify);
router.get("/me/students/eligibility", requireAuth, tc.checkEligibility);

// ─── Tickets ───
router.post("/me/tickets", requireAuth, tc.purchaseTicket);
router.get("/me/tickets", requireAuth, tc.listMyTickets);
router.get("/me/tickets/:id", requireAuth, tc.getTicketDetail);
router.post("/me/tickets/:id/cancel", requireAuth, tc.cancelTicket);
router.post("/me/tickets/checkout", requireAuth, tc.payosCheckout);
router.post("/me/tickets/checkout/poll", requireAuth, tc.payosPoll);
router.post("/me/tickets/checkout/cancel", requireAuth, tc.payosCancel);

// ─── Verify QR (admin/staff quét) ───
router.post("/tickets/verify", requireAuth, tc.verifyQr);

export default router;
