import * as favoriteService from "../services/favoriteService.js";
import * as searchService from "../services/searchHistoryService.js";
import * as userFeedbackService from "../services/userFeedbackService.js";

function handleError(res, err, context) {
  console.error(`[passengerController.${context}]`, err);
  res.status(err.status || 500).json({ error: err.message || "Lỗi server." });
}

export async function listFavorites(req, res) {
  try {
    const data = await favoriteService.listFavorites(req.user.id, {
      type: req.query.type,
    });
    res.json({ data });
  } catch (err) {
    handleError(res, err, "listFavorites");
  }
}

export async function addFavorite(req, res) {
  try {
    const data = await favoriteService.addFavorite(req.user.id, req.body);
    res.status(201).json({ message: "Đã thêm yêu thích.", data });
  } catch (err) {
    handleError(res, err, "addFavorite");
  }
}

export async function removeFavorite(req, res) {
  try {
    const data = await favoriteService.removeFavorite(
      req.user.id,
      req.params.id,
    );
    res.json({ message: "Đã xóa.", data });
  } catch (err) {
    handleError(res, err, "removeFavorite");
  }
}

export async function listSearchHistory(req, res) {
  try {
    const data = await searchService.listSearchHistory(req.user.id, {
      limit: req.query.limit,
    });
    res.json({ data });
  } catch (err) {
    handleError(res, err, "listSearchHistory");
  }
}

export async function addSearchHistory(req, res) {
  try {
    const data = await searchService.addSearchHistory(req.user.id, req.body);
    res.status(201).json({ data });
  } catch (err) {
    handleError(res, err, "addSearchHistory");
  }
}

export async function clearSearchHistory(req, res) {
  try {
    const data = await searchService.clearSearchHistory(req.user.id);
    res.json({ message: "Đã xóa lịch sử.", ...data });
  } catch (err) {
    handleError(res, err, "clearSearchHistory");
  }
}

export async function listFeedbacks(req, res) {
  try {
    const data = await userFeedbackService.listFeedbacks(req.user.id, {
      limit: req.query.limit,
    });
    res.json({ data });
  } catch (err) {
    handleError(res, err, "listFeedbacks");
  }
}

export async function createFeedback(req, res) {
  try {
    const data = await userFeedbackService.createFeedback(
      req.user.id,
      req.body,
    );
    res.status(201).json({ message: "Đã gửi đánh giá.", data });
  } catch (err) {
    handleError(res, err, "createFeedback");
  }
}

export async function submitFeedback(req, res) {
  try {
    const userId = req.user?.id || null;
    const data = await userFeedbackService.createFeedback(userId, req.body);
    res.status(201).json({ message: "Cảm ơn bạn đã gửi góp ý!", data });
  } catch (err) {
    handleError(res, err, "submitFeedback");
  }
}
