import * as routeService from "../services/routeService.js";

export async function getRoutes(req, res) {
  try {
    let is_active;
    if (req.query.is_active !== undefined) is_active = req.query.is_active === "true";
    const result = await routeService.getAllRoutes({
      page: req.query.page, limit: req.query.limit, is_active, keyword: req.query.q || "",
    });
    res.json(result);
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
}

export async function getStats(req, res) {
  try { res.json(await routeService.getRouteStats()); }
  catch (e) { res.status(e.status || 500).json({ error: e.message }); }
}

export async function getById(req, res) {
  try { res.json(await routeService.getRouteById(req.params.id)); }
  catch (e) { res.status(e.status || 500).json({ error: e.message }); }
}

export async function getFull(req, res) {
  try { res.json(await routeService.getFullRoute(req.params.id)); }
  catch (e) { res.status(e.status || 500).json({ error: e.message }); }
}

export async function create(req, res) {
  try {
    const r = await routeService.createRoute(req.body);
    res.status(201).json({ message: "Tạo tuyến thành công.", data: r });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
}

export async function update(req, res) {
  try {
    const r = await routeService.updateRoute(req.params.id, req.body);
    res.json({ message: "Cập nhật thành công.", data: r });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
}

export async function changeStatus(req, res) {
  try {
    const r = await routeService.changeRouteStatus(req.params.id, req.body.is_active);
    res.json({ message: "Đổi trạng thái thành công.", data: r });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
}
