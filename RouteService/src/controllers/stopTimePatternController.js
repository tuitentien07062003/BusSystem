import * as svc from "../services/stopTimePatternService.js";

export async function list(req, res) {
  try {
    const result = await svc.getAllStopTimes({
      page: req.query.page,
      limit: req.query.limit,
      trip_pattern_id: req.query.trip_pattern_id,
      stop_id: req.query.stop_id,
    });
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function stats(req, res) {
  try {
    res.json(await svc.getStopTimeStats());
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function byPattern(req, res) {
  try {
    res.json({ data: await svc.getStopsByPattern(req.params.patternId) });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function getById(req, res) {
  try {
    res.json(await svc.getStopTimeById(req.params.id));
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function create(req, res) {
  try {
    const r = await svc.createStopTime(req.body);
    res.status(201).json({ message: "Tạo stop_time thành công.", data: r });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function update(req, res) {
  try {
    const r = await svc.updateStopTime(req.params.id, req.body);
    res.json({ message: "Cập nhật thành công.", data: r });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function remove(req, res) {
  try {
    await svc.deleteStopTime(req.params.id);
    res.json({ message: "Đã xoá." });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function bulkReplace(req, res) {
  try {
    const stops = req.body?.stops || [];
    const data = await svc.bulkReplaceStopTimes(req.params.patternId, stops);
    res.json({ message: "Đã cập nhật danh sách trạm.", data });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
