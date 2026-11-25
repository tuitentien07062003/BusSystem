import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "tbus_passenger_secret_2026";
const ACCESS_EXPIRE = process.env.JWT_ACCESS_EXPIRE || "30m";

export function signAccessToken(user, roles = []) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      full_name: user.full_name,
      roles,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRE },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function generateRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

export function computeRefreshExpiry() {
  const days = parseInt(process.env.JWT_REFRESH_EXPIRE_DAYS) || 7;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
