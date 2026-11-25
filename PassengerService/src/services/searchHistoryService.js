import { SearchHistory } from "../models/index.js";

function toPlain(instance) {
  return instance ? instance.get({ plain: true }) : null;
}

export async function listSearchHistory(userId, { limit = 30 } = {}) {
  const rows = await SearchHistory.findAll({
    where: { user_id: userId },
    order: [["created_at", "DESC"]],
    limit: Math.min(Math.max(1, parseInt(limit)), 100),
  });
  return rows.map(toPlain);
}

export async function addSearchHistory(userId, payload = {}) {
  const { from_text, to_text, from_stop_id, to_stop_id } = payload;

  const created = await SearchHistory.create({
    user_id: userId,
    from_text: from_text || null,
    to_text: to_text || null,
    from_stop_id: from_stop_id || null,
    to_stop_id: to_stop_id || null,
    created_at: new Date(),
  });
  return toPlain(created);
}

export async function clearSearchHistory(userId) {
  const count = await SearchHistory.destroy({ where: { user_id: userId } });
  return { deleted: count };
}
