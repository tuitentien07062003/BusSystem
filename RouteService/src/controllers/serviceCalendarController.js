import * as svc from "../services/serviceCalendarService.js";

export async function list(req, res) {
  try {
    res.json(
      await svc.getAll({
        page: req.query.page,
        limit: req.query.limit,
        keyword: req.query.q || "",
      }),
    );
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
export async function getById(req, res) {
  try {
    res.json(await svc.getById(req.params.id));
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
export async function create(req, res) {
  try {
    const payload = {
      ...req.body,
      headway_multiplier:
        req.body.headway_multiplier !== undefined
          ? parseFloat(req.body.headway_multiplier)
          : undefined,
    };
    const r = await svc.create(payload);
    res.status(201).json({ message: "Tạo lịch thành công.", data: r });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function update(req, res) {
  try {
    const payload = {
      ...req.body,
      headway_multiplier:
        req.body.headway_multiplier !== undefined
          ? parseFloat(req.body.headway_multiplier)
          : undefined,
    };
    const r = await svc.update(req.params.id, payload);
    res.json({ message: "Cập nhật thành công.", data: r });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function remove(req, res) {
  try {
    await svc.remove(req.params.id);
    res.json({ message: "Đã xóa." });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
