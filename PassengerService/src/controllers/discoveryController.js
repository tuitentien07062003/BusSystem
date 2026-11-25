import * as svc from "../services/discoveryService.js";
import * as travelAgent from "../services/travelAgentService.js";

function handleError(res, err, context) {
  console.error(`[discoveryController.${context}]`, err);
  res.status(err.status || 500).json({
    error: err.message || "Lỗi server.",
  });
}

export async function nearbyStops(req, res) {
  try {
    const data = await svc.getNearbyStops({
      lat: req.query.lat,
      lng: req.query.lng,
      radius: req.query.radius,
      limit: req.query.limit,
    });
    res.json({ total: data.length, data });
  } catch (err) {
    handleError(res, err, "nearbyStops");
  }
}

export async function routesByStop(req, res) {
  try {
    const data = await svc.getRoutesByStop(req.params.id);
    res.json({ stop_id: parseInt(req.params.id), total: data.length, data });
  } catch (err) {
    handleError(res, err, "routesByStop");
  }
}

export async function routeDetail(req, res) {
  try {
    const data = await svc.getRouteDetail(req.params.id);
    res.json(data);
  } catch (err) {
    handleError(res, err, "routeDetail");
  }
}

export async function searchDirect(req, res) {
  try {
    const data = await svc.searchDirectRoutes(req.query.from, req.query.to);
    res.json({ total: data.length, data });
  } catch (err) {
    handleError(res, err, "searchDirect");
  }
}

export async function routeSchedule(req, res) {
  try {
    const data = await svc.getRouteSchedule(req.params.id, req.query.date);
    res.json(data);
  } catch (err) {
    handleError(res, err, "routeSchedule");
  }
}

export async function searchTransfer(req, res) {
  try {
    const data = await svc.searchTransferRoutes(req.query.from, req.query.to, {
      maxResults: req.query.limit,
    });
    res.json({ total: data.length, data });
  } catch (err) {
    handleError(res, err, "searchTransfer");
  }
}

export async function routeTrips(req, res) {
  try {
    const data = await svc.getRouteTrips(req.params.id, req.query.date);
    res.json(data);
  } catch (err) {
    handleError(res, err, "routeTrips");
  }
}

export async function mapNetwork(req, res) {
  try {
    const data = await svc.getMapNetwork();
    res.json(data);
  } catch (err) {
    handleError(res, err, "mapNetwork");
  }
}

export async function allStops(req, res) {
  try {
    const data = await svc.getAllStopsForSearch();
    res.json({ total: data.length, data });
  } catch (err) {
    handleError(res, err, "allStops");
  }
}

export async function chat(req, res) {
  try {
    const { message, history, user_location } = req.body;
    const result = await travelAgent.run({
      message,
      history: history || [],
      userLocation: user_location || null,
    });
    res.json(result);
  } catch (err) {
    console.error("[discoveryController.chat]", err);
    res.status(err.status || 500).json({
      error: err.message || "Agent unavailable",
    });
  }
}
