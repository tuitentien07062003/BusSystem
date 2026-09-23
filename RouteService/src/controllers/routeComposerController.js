import * as composerService from "../services/routeComposerService.js";

export async function getDepots(req, res) {
  try { res.json({ data: await composerService.getDepotsForComposer() }); }
  catch (e) { res.status(e.status || 500).json({ error: e.message }); }
}

export async function searchStops(req, res) {
  try {
    const data = await composerService.searchStopsForComposer({
      keyword: req.query.q || "",
      limit: req.query.limit || 50,
    });
    res.json({ data });
  } catch (e) {
    console.error("[searchStops]", e);
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function getStopsByIds(req, res) {
  try {
    const raw = String(req.query.ids || "").trim();
    const ids = raw ? raw.split(",").map((s) => parseInt(s)).filter((n) => !isNaN(n)) : [];
    // Reuse service — không có getStopsByIds riêng nên trả về rỗng
    res.json({ data: [] });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

// POST /tbus/routes/composer/match-stops
// Body: { start_depot_id, end_depot_id, stop_ids: [] }
export async function matchStops(req, res) {
  try {
    const result = await composerService.matchStopsToRoad(req.body);
    res.json(result);
  } catch (e) {
    console.error("[matchStops]", e);
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function preview(req, res) {
  try {
    const result = await composerService.previewRoute(req.body);
    console.log(`[Preview] engine=${result.routing_engine} match=${result.match_info?.matched_count}/${result.match_info?.total} warnings=${result.order_check?.warnings?.length || 0}`);
    res.json(result);
  } catch (e) {
    console.error("[preview]", e);
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function save(req, res) {
  try {
    const result = await composerService.saveComposedRoute(req.body);
    res.status(201).json({ message: "Tạo tuyến thành công.", ...result });
  } catch (e) {
    console.error("[save]", e);
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function remove(req, res) {
  try {
    await composerService.deleteComposedRoute(req.params.id);
    res.json({ message: "Đã xóa tuyến." });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
