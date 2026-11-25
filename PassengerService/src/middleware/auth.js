import { verifyAccessToken } from "../services/jwtService.js";
import { User, UserRole } from "../models/index.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid Authorization header." });
    }

    const token = header.slice(7);
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      const msg =
        err.name === "TokenExpiredError" ? "Token expired." : "Invalid token.";
      return res.status(401).json({ error: msg });
    }

    const user = await User.findByPk(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "User không tồn tại." });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: "Tài khoản đã bị khóa." });
    }

    const roles = await UserRole.findAll({
      where: { user_id: user.id },
      attributes: ["role"],
      raw: true,
    });

    req.user = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      roles: roles.map((r) => r.role),
    };

    next();
  } catch (err) {
    console.error("[requireAuth]", err);
    res.status(500).json({ error: "Lỗi xác thực." });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Chưa đăng nhập." });
    }
    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return res.status(403).json({
        error: `Cần quyền: ${allowedRoles.join(" hoặc ")}.`,
      });
    }
    next();
  };
}

export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return next();
    }

    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    const user = await User.findByPk(payload.sub);

    if (user && user.is_active) {
      req.user = { id: user.id };
    }
  } catch (err) {}
  next();
}
