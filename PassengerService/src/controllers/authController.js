import * as authService from "../services/authService.js";

function handleError(res, err, context) {
  console.error(`[authController.${context}]`, err);
  res.status(err.status || 500).json({ error: err.message || "Lỗi server." });
}

export async function register(req, res) {
  try {
    const data = await authService.register(req.body);
    res.status(201).json({ message: "Đăng ký thành công.", data });
  } catch (err) {
    handleError(res, err, "register");
  }
}

export async function login(req, res) {
  try {
    const data = await authService.login(req.body);
    res.json(data);
  } catch (err) {
    handleError(res, err, "login");
  }
}

export async function refresh(req, res) {
  try {
    const data = await authService.refresh(req.body?.refresh_token);
    res.json(data);
  } catch (err) {
    handleError(res, err, "refresh");
  }
}

export async function logout(req, res) {
  try {
    const data = await authService.logout(req.body?.refresh_token);
    res.json({ message: "Đã đăng xuất.", ...data });
  } catch (err) {
    handleError(res, err, "logout");
  }
}

export async function getMe(req, res) {
  try {
    const data = await authService.getMe(req.user.id);
    res.json(data);
  } catch (err) {
    handleError(res, err, "getMe");
  }
}

export async function updateMe(req, res) {
  try {
    const data = await authService.updateProfile(req.user.id, req.body);
    res.json({ message: "Đã cập nhật.", data });
  } catch (err) {
    handleError(res, err, "updateMe");
  }
}

export async function changePassword(req, res) {
  try {
    const data = await authService.changePassword(req.user.id, req.body);
    res.json({ message: "Đã đổi mật khẩu.", ...data });
  } catch (err) {
    handleError(res, err, "changePassword");
  }
}
