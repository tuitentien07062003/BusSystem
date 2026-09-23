import * as svc from "../services/tripPatternService.js";

export async function list(req, res) {
  try {
    const result = await svc.getAllPatterns({
      page: req.query.page,
      limit: req.query.limit,
      route_id: req.query.route_id,
      direction_id: req.query.direction_id,
      keyword: req.query.q || "",
    });
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function stats(req, res) {
  try {
    res.json(await svc.getPatternStats());
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function byRoute(req, res) {
  try {
    res.json({ data: await svc.getPatternsByRoute(req.params.routeId) });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function getById(req, res) {
  try {
    res.json(await svc.getPatternById(req.params.id));
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function getDetail(req, res) {
  try {
    res.json(await svc.getPatternDetail(req.params.id));
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function create(req, res) {
  try {
    const r = await svc.createPattern(req.body);
    res.status(201).json({ message: "Tạo pattern thành công.", data: r });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function update(req, res) {
  try {
    const r = await svc.updatePattern(req.params.id, req.body);
    res.json({ message: "Cập nhật thành công.", data: r });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function remove(req, res) {
  try {
    const cascade = req.query.cascade !== "false";
    await svc.deletePattern(req.params.id, { cascade });
    res.json({ message: "Đã xoá pattern." });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
