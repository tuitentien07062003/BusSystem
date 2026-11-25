import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { User, UserRole, RefreshToken } from "../models/index.js";
import {
  signAccessToken,
  generateRefreshToken,
  computeRefreshExpiry,
} from "./jwtService.js";

function toPlain(instance) {
  return instance ? instance.get({ plain: true }) : null;
}

function sanitizeUser(user, roles = []) {
  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    avatar_url: user.avatar_url,
    is_active: user.is_active,
    roles,
    created_at: user.created_at,
  };
}

async function loadRoles(userId) {
  const rows = await UserRole.findAll({
    where: { user_id: userId },
    attributes: ["role"],
    raw: true,
  });
  return rows.map((r) => r.role);
}

export async function register(payload = {}) {
  const { username, password, full_name, email, phone } = payload;

  if (!username || !password || !full_name) {
    const err = new Error("username, password, full_name là bắt buộc.");
    err.status = 400;
    throw err;
  }
  if (String(username).length < 3 || String(username).length > 50) {
    const err = new Error("username phải từ 3 đến 50 ký tự.");
    err.status = 400;
    throw err;
  }
  if (String(password).length < 6) {
    const err = new Error("Mật khẩu tối thiểu 6 ký tự.");
    err.status = 400;
    throw err;
  }

  const orConds = [{ username: String(username).trim() }];
  if (phone) orConds.push({ phone: String(phone).trim() });
  if (email) orConds.push({ email: String(email).trim().toLowerCase() });

  const existing = await User.findOne({ where: { [Op.or]: orConds } });
  if (existing) {
    const err = new Error("username, email hoặc SĐT đã tồn tại.");
    err.status = 409;
    throw err;
  }

  const hash = await bcrypt.hash(password, 10);
  const now = new Date();

  const user = await User.create({
    username: String(username).trim(),
    password_hash: hash,
    full_name: String(full_name).trim(),
    email: email ? String(email).trim().toLowerCase() : null,
    phone: phone ? String(phone).trim() : null,
    is_active: true,
    created_at: now,
    updated_at: now,
  });

  await UserRole.create({
    user_id: user.id,
    role: "PASSENGER",
    created_at: now,
  });

  return sanitizeUser(toPlain(user), ["PASSENGER"]);
}

export async function login({ username, password } = {}) {
  if (!username || !password) {
    const err = new Error("username và password là bắt buộc.");
    err.status = 400;
    throw err;
  }

  const user = await User.findOne({
    where: { username: String(username).trim() },
  });

  if (!user) {
    const err = new Error("Sai tài khoản hoặc mật khẩu.");
    err.status = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const err = new Error("Sai tài khoản hoặc mật khẩu.");
    err.status = 401;
    throw err;
  }

  if (!user.is_active) {
    const err = new Error("Tài khoản đã bị khóa.");
    err.status = 403;
    throw err;
  }

  const roles = await loadRoles(user.id);

  const access_token = signAccessToken(toPlain(user), roles);
  const refresh_token = generateRefreshToken();
  const expires_at = computeRefreshExpiry();

  await RefreshToken.create({
    user_id: user.id,
    token: refresh_token,
    expires_at,
    created_at: new Date(),
  });

  return {
    access_token,
    refresh_token,
    user: sanitizeUser(toPlain(user), roles),
  };
}

export async function refresh(refreshToken) {
  if (!refreshToken) {
    const err = new Error("refresh_token là bắt buộc.");
    err.status = 400;
    throw err;
  }

  const row = await RefreshToken.findOne({ where: { token: refreshToken } });
  if (!row) {
    const err = new Error("Refresh token không hợp lệ.");
    err.status = 401;
    throw err;
  }
  if (row.revoked_at) {
    const err = new Error("Refresh token đã bị thu hồi.");
    err.status = 401;
    throw err;
  }
  if (new Date(row.expires_at) < new Date()) {
    const err = new Error("Refresh token đã hết hạn.");
    err.status = 401;
    throw err;
  }

  const user = await User.findByPk(row.user_id);
  if (!user || !user.is_active) {
    const err = new Error("User không hợp lệ.");
    err.status = 401;
    throw err;
  }

  const roles = await loadRoles(user.id);
  const access_token = signAccessToken(toPlain(user), roles);

  return { access_token, user: sanitizeUser(toPlain(user), roles) };
}

export async function logout(refreshToken) {
  if (!refreshToken) {
    const err = new Error("refresh_token là bắt buộc.");
    err.status = 400;
    throw err;
  }
  await RefreshToken.update(
    { revoked_at: new Date() },
    { where: { token: refreshToken, revoked_at: null } },
  );
  return { logged_out: true };
}

export async function getMe(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error("User không tồn tại.");
    err.status = 404;
    throw err;
  }
  const roles = await loadRoles(user.id);
  return sanitizeUser(toPlain(user), roles);
}

export async function updateProfile(userId, payload = {}) {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error("User không tồn tại.");
    err.status = 404;
    throw err;
  }

  const updates = {};
  if (payload.full_name !== undefined) {
    const v = String(payload.full_name).trim();
    if (!v) {
      const err = new Error("full_name không được để trống.");
      err.status = 400;
      throw err;
    }
    updates.full_name = v;
  }
  if (payload.email !== undefined) {
    updates.email = payload.email
      ? String(payload.email).trim().toLowerCase()
      : null;
  }
  if (payload.phone !== undefined) {
    updates.phone = payload.phone ? String(payload.phone).trim() : null;
  }
  if (payload.avatar_url !== undefined) {
    updates.avatar_url = payload.avatar_url || null;
  }

  if (Object.keys(updates).length === 0) {
    const err = new Error("Không có trường nào để cập nhật.");
    err.status = 400;
    throw err;
  }

  updates.updated_at = new Date();
  await user.update(updates);

  return getMe(userId);
}

export async function changePassword(
  userId,
  { old_password, new_password } = {},
) {
  if (!old_password || !new_password) {
    const err = new Error("old_password và new_password là bắt buộc.");
    err.status = 400;
    throw err;
  }
  if (String(new_password).length < 6) {
    const err = new Error("Mật khẩu mới tối thiểu 6 ký tự.");
    err.status = 400;
    throw err;
  }

  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error("User không tồn tại.");
    err.status = 404;
    throw err;
  }

  const ok = await bcrypt.compare(old_password, user.password_hash);
  if (!ok) {
    const err = new Error("Mật khẩu cũ không đúng.");
    err.status = 401;
    throw err;
  }

  const hash = await bcrypt.hash(new_password, 10);
  await user.update({ password_hash: hash, updated_at: new Date() });

  await RefreshToken.update(
    { revoked_at: new Date() },
    { where: { user_id: userId, revoked_at: null } },
  );

  return { changed: true };
}
