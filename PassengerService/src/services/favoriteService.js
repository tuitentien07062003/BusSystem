import { Op } from "sequelize";
import { Favorite } from "../models/index.js";

function toPlain(instance) {
  return instance ? instance.get({ plain: true }) : null;
}

export async function listFavorites(userId, { type } = {}) {
  const where = { user_id: userId };
  if (type && ["route", "stop"].includes(type)) where.type = type;

  const rows = await Favorite.findAll({
    where,
    order: [["created_at", "DESC"]],
  });
  return rows.map(toPlain);
}

export async function addFavorite(userId, { type, target_id } = {}) {
  if (!type || !target_id) {
    const err = new Error("type và target_id là bắt buộc.");
    err.status = 400;
    throw err;
  }
  if (!["route", "stop"].includes(type)) {
    const err = new Error("type phải là route hoặc stop.");
    err.status = 400;
    throw err;
  }

  const existing = await Favorite.findOne({
    where: { user_id: userId, type, target_id: parseInt(target_id) },
  });
  if (existing) {
    const err = new Error("Đã có trong danh sách yêu thích.");
    err.status = 409;
    throw err;
  }

  const created = await Favorite.create({
    user_id: userId,
    type,
    target_id: parseInt(target_id),
    created_at: new Date(),
  });
  return toPlain(created);
}

export async function removeFavorite(userId, favoriteId) {
  const fav = await Favorite.findOne({
    where: { id: favoriteId, user_id: userId },
  });
  if (!fav) {
    const err = new Error("Không tìm thấy favorite.");
    err.status = 404;
    throw err;
  }
  await fav.destroy();
  return { id: parseInt(favoriteId) };
}
