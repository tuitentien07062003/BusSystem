import { Op, fn, col } from "sequelize";
import sequelize from "../config/database.js";
import StopTimePattern from "../models/stopTimePatternModel.js";
import TripPattern from "../models/tripPatternModel.js";
import Stop from "../models/stopModel.js";

function toPlain(s) {
  if (!s) return null;
  const o = s.get ? s.get({ plain: true }) : s;
  // Ép kiểu BIGINT về Number cho FE dễ sort
  if (o.id != null) o.id = Number(o.id);
  if (o.trip_pattern_id != null) o.trip_pattern_id = Number(o.trip_pattern_id);
  if (o.stop_id != null) o.stop_id = Number(o.stop_id);
  if (o.stop_sequence != null) o.stop_sequence = Number(o.stop_sequence);
  return o;
}

// ═══════════════════════════════════════════════════════════════
// Lấy danh sách stop_time_patterns — có join stop info
// ═══════════════════════════════════════════════════════════════
export async function getAllStopTimes({
  page = 1,
  limit = 50,
  trip_pattern_id,
  stop_id,
} = {}) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(Math.max(1, parseInt(limit) || 50), 500);
  const offset = (page - 1) * limit;

  const where = {};
  if (trip_pattern_id) where.trip_pattern_id = parseInt(trip_pattern_id);
  if (stop_id) where.stop_id = parseInt(stop_id);

  const { count, rows } = await StopTimePattern.findAndCountAll({
    where,
    limit,
    offset,
    order: [
      ["trip_pattern_id", "ASC"],
      ["stop_sequence", "ASC"],
    ],
    include: [
      {
        model: Stop,
        as: "stop",
        attributes: ["id", "stop_id", "stop_name", "stop_type"],
        required: false,
      },
      {
        model: TripPattern,
        as: "pattern",
        attributes: ["id", "pattern_code", "direction_id", "trip_headsign"],
        required: false,
      },
    ],
  });

  return {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    data: rows.map((r) => {
      const o = toPlain(r);
      // Đảm bảo trả về stop info + pattern info
      if (o.stop) {
        o.stop.id = Number(o.stop.id);
      }
      if (o.pattern) {
        o.pattern.id = Number(o.pattern.id);
      }
      return o;
    }),
  };
}

// ─── Lấy toàn bộ stops của 1 pattern (kèm info stop) ───
export async function getStopsByPattern(tripPatternId) {
  const sts = await StopTimePattern.findAll({
    where: { trip_pattern_id: tripPatternId },
    order: [["stop_sequence", "ASC"]],
  });

  const stopIds = sts.map((s) => s.stop_id).filter(Boolean);
  let stopsMap = new Map();

  if (stopIds.length > 0) {
    const stops = await Stop.findAll({
      where: { id: { [Op.in]: stopIds } },
      attributes: {
        include: [
          [fn("ST_X", col("geom")), "longitude"],
          [fn("ST_Y", col("geom")), "latitude"],
        ],
      },
    });
    stopsMap = new Map(
      stops.map((s) => {
        const o = s.get({ plain: true });
        return [
          Number(o.id),
          {
            id: Number(o.id),
            stop_id: o.stop_id,
            stop_name: o.stop_name,
            stop_type: o.stop_type,
            is_active: o.is_active,
            latitude: parseFloat(o.latitude),
            longitude: parseFloat(o.longitude),
          },
        ];
      })
    );
  }

  return sts.map((st) => {
    const o = st.get({ plain: true });
    return {
      ...o,
      id: Number(o.id),
      trip_pattern_id: Number(o.trip_pattern_id),
      stop_id: Number(o.stop_id),
      stop_sequence: Number(o.stop_sequence),
      stop: stopsMap.get(Number(o.stop_id)) || null,
    };
  });
}

export async function getStopTimeById(id) {
  const st = await StopTimePattern.findByPk(id, {
    include: [
      {
        model: Stop,
        as: "stop",
        attributes: ["id", "stop_id", "stop_name", "stop_type"],
        required: false,
      },
    ],
  });
  if (!st) {
    const e = new Error("Không tìm thấy stop_time.");
    e.status = 404;
    throw e;
  }
  return toPlain(st);
}

// ═══════════════════════════════════════════════════════════════
// Validate payload
// ═══════════════════════════════════════════════════════════════
function validateStopTime(payload, { requireAll = false } = {}) {
  const errors = [];
  if (requireAll || payload.stop_id !== undefined) {
    if (!payload.stop_id) errors.push("stop_id là bắt buộc.");
  }
  if (requireAll || payload.stop_sequence !== undefined) {
    const seq = parseInt(payload.stop_sequence);
    if (!Number.isInteger(seq) || seq < 1) {
      errors.push("stop_sequence phải là số nguyên >= 1.");
    }
  }
  if (requireAll || payload.arrival_offset_seconds !== undefined) {
    const arr = parseInt(payload.arrival_offset_seconds);
    if (!Number.isInteger(arr) || arr < 0) {
      errors.push("arrival_offset_seconds phải là số nguyên >= 0.");
    }
  }
  if (requireAll || payload.departure_offset_seconds !== undefined) {
    const dep = parseInt(payload.departure_offset_seconds);
    if (!Number.isInteger(dep) || dep < 0) {
      errors.push("departure_offset_seconds phải là số nguyên >= 0.");
    }
  }
  if (payload.arrival_offset_seconds !== undefined && payload.departure_offset_seconds !== undefined) {
    const arr = parseInt(payload.arrival_offset_seconds);
    const dep = parseInt(payload.departure_offset_seconds);
    if (dep < arr) {
      errors.push("departure_offset_seconds phải >= arrival_offset_seconds.");
    }
  }
  return errors;
}

export async function createStopTime(payload = {}) {
  const errors = validateStopTime(payload, { requireAll: true });
  if (errors.length) {
    const e = new Error(errors.join(" "));
    e.status = 400;
    throw e;
  }

  const patternId = parseInt(payload.trip_pattern_id);
  const seq = parseInt(payload.stop_sequence);

  const dup = await StopTimePattern.findOne({
    where: { trip_pattern_id: patternId, stop_sequence: seq },
  });
  if (dup) {
    const e = new Error(`stop_sequence = ${seq} đã tồn tại trong pattern.`);
    e.status = 409;
    throw e;
  }

  const created = await StopTimePattern.create({
    trip_pattern_id: patternId,
    stop_id: parseInt(payload.stop_id),
    stop_sequence: seq,
    arrival_offset_seconds: parseInt(payload.arrival_offset_seconds),
    departure_offset_seconds: parseInt(payload.departure_offset_seconds),
  });
  return toPlain(created);
}

export async function updateStopTime(id, payload = {}) {
  const st = await StopTimePattern.findByPk(id);
  if (!st) {
    const e = new Error("Không tìm thấy stop_time.");
    e.status = 404;
    throw e;
  }

  const errors = validateStopTime(payload, { requireAll: false });
  if (errors.length) {
    const e = new Error(errors.join(" "));
    e.status = 400;
    throw e;
  }

  const updates = {};
  if (payload.stop_id !== undefined) updates.stop_id = parseInt(payload.stop_id);
  if (payload.stop_sequence !== undefined) {
    const seq = parseInt(payload.stop_sequence);
    if (seq !== Number(st.stop_sequence)) {
      const dup = await StopTimePattern.findOne({
        where: { trip_pattern_id: st.trip_pattern_id, stop_sequence: seq },
      });
      if (dup) {
        const e = new Error(`stop_sequence = ${seq} đã tồn tại.`);
        e.status = 409;
        throw e;
      }
    }
    updates.stop_sequence = seq;
  }
  if (payload.arrival_offset_seconds !== undefined) {
    updates.arrival_offset_seconds = parseInt(payload.arrival_offset_seconds);
  }
  if (payload.departure_offset_seconds !== undefined) {
    updates.departure_offset_seconds = parseInt(payload.departure_offset_seconds);
  }

  if (Object.keys(updates).length === 0) {
    const e = new Error("Không có trường nào để cập nhật.");
    e.status = 400;
    throw e;
  }

  await st.update(updates);
  return getStopTimeById(id);
}

export async function deleteStopTime(id) {
  const st = await StopTimePattern.findByPk(id);
  if (!st) {
    const e = new Error("Không tìm thấy stop_time.");
    e.status = 404;
    throw e;
  }
  await st.destroy();
  return { id: Number(id) };
}

// ═══════════════════════════════════════════════════════════════
// Bulk replace
// ═══════════════════════════════════════════════════════════════
export async function bulkReplaceStopTimes(tripPatternId, stops = []) {
  const patternId = parseInt(tripPatternId);
  const p = await TripPattern.findByPk(patternId);
  if (!p) {
    const e = new Error("Không tìm thấy pattern.");
    e.status = 404;
    throw e;
  }

  const seqs = new Set();
  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    if (!s.stop_id) {
      const e = new Error(`stops[${i}] thiếu stop_id.`);
      e.status = 400;
      throw e;
    }
    const seq = parseInt(s.stop_sequence);
    if (!Number.isInteger(seq) || seq < 1) {
      const e = new Error(`stops[${i}] stop_sequence không hợp lệ.`);
      e.status = 400;
      throw e;
    }
    if (seqs.has(seq)) {
      const e = new Error(`stops[${i}] stop_sequence ${seq} bị trùng.`);
      e.status = 400;
      throw e;
    }
    seqs.add(seq);

    const arr = parseInt(s.arrival_offset_seconds);
    const dep = parseInt(s.departure_offset_seconds);
    if (!Number.isInteger(arr) || arr < 0) {
      const e = new Error(`stops[${i}] arrival_offset_seconds không hợp lệ.`);
      e.status = 400;
      throw e;
    }
    if (!Number.isInteger(dep) || dep < arr) {
      const e = new Error(`stops[${i}] departure_offset_seconds phải >= arrival.`);
      e.status = 400;
      throw e;
    }
  }

  const transaction = await sequelize.transaction();
  try {
    await StopTimePattern.destroy({
      where: { trip_pattern_id: patternId },
      transaction,
    });

    if (stops.length > 0) {
      const rows = stops.map((s) => ({
        trip_pattern_id: patternId,
        stop_id: parseInt(s.stop_id),
        stop_sequence: parseInt(s.stop_sequence),
        arrival_offset_seconds: parseInt(s.arrival_offset_seconds),
        departure_offset_seconds: parseInt(s.departure_offset_seconds),
      }));
      await StopTimePattern.bulkCreate(rows, { transaction });
    }

    await transaction.commit();
    return await getStopsByPattern(patternId);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// ─── Stats ───
export async function getStopTimeStats() {
  const [total, patternCount, stopCount] = await Promise.all([
    StopTimePattern.count(),
    StopTimePattern.count({ distinct: true, col: "trip_pattern_id" }),
    StopTimePattern.count({ distinct: true, col: "stop_id" }),
  ]);
  return { total, patternCount, stopCount };
}
