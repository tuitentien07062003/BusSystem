import * as discoveryService from "./discoveryService.js";

/**
 * Tool 1: resolve_location
 * Tìm stop theo tên địa danh, quận, hoặc từ khóa
 */
export const resolveLocationTool = {
  name: "resolve_location",
  description:
    "Tìm trạm xe buýt dựa trên tên địa danh, quận, hoặc từ khóa. " +
    "User thường dùng tên quận ('Q1', 'Quận 7'), địa danh ('Bến Thành', 'Suối Tiên'), " +
    "hoặc tên trạm chính thức. Trả về danh sách trạm khớp. " +
    "Nếu có nhiều kết quả, ưu tiên trạm có tên khớp nhất với keyword.",
  parameters: {
    type: "object",
    properties: {
      keyword: {
        type: "string",
        description: "Tên địa danh, quận, hoặc từ khóa trạm",
      },
    },
    required: ["keyword"],
  },
  handler: async ({ keyword }) => {
    const kw = String(keyword).trim();
    const lowerKw = kw.toLowerCase();

    try {
      const all = await discoveryService.getAllStopsForSearch();

      const matches = (all || [])
        .filter(
          (s) =>
            (s.name || "").toLowerCase().includes(lowerKw) ||
            (s.code || "").toLowerCase().includes(lowerKw),
        )
        .slice(0, 5)
        .map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          latitude: s.latitude,
          longitude: s.longitude,
        }));

      if (matches.length > 0) {
        return { found: true, stops: matches };
      }
    } catch (e) {
      console.error("[resolve_location] error:", e.message);
    }

    return {
      found: false,
      message: `Không tìm thấy trạm nào khớp "${keyword}".`,
    };
  },
};

/**
 * Tool 2: search_routes
 * Tìm tuyến từ stop A đến stop B
 */
export const searchRoutesTool = {
  name: "search_routes",
  description:
    "Tìm tuyến xe buýt từ trạm A đến trạm B. " +
    "Trả về 2 loại: tuyến trực tiếp (không chuyển) và tuyến cần chuyển (1-2 lần). " +
    "Mỗi kết quả có route_id, route_short_name, route_full_name, duration (phút), transfers (số lần chuyển).",
  parameters: {
    type: "object",
    properties: {
      from_stop_id: { type: "integer", description: "ID trạm đi" },
      to_stop_id: { type: "integer", description: "ID trạm đến" },
    },
    required: ["from_stop_id", "to_stop_id"],
  },
  handler: async ({ from_stop_id, to_stop_id }) => {
    const [direct, transfer] = await Promise.all([
      discoveryService
        .searchDirectRoutes(from_stop_id, to_stop_id)
        .catch(() => []),
      discoveryService
        .searchTransferRoutes(from_stop_id, to_stop_id, { maxResults: 3 })
        .catch(() => []),
    ]);
    console.log(
      "[search_routes] direct:",
      direct?.length,
      "transfer:",
      transfer?.length,
    );

    return {
      direct: (direct || []).slice(0, 5).map((r) => ({
        route_id: r.route.id,
        route_short_name: r.route.short_name,
        route_full_name: r.route.full_name,
        duration_min: r.travel_time_min,
        stops_count: r.stop_count,
      })),
      transfer: (transfer || []).slice(0, 3).map((t) => ({
        route_1: { id: t.route_1.id, short_name: t.route_1.short_name },
        route_2: { id: t.route_2.id, short_name: t.route_2.short_name },
        transfer_stop_name: t.transfer_stop.name,
        walk_distance_m: t.walk_distance_m,
      })),
      total_direct: direct?.length || 0,
      total_transfer: transfer?.length || 0,
    };
  },
};

/**
 * Tool 3: get_schedule
 * Lấy lịch chạy của route
 */
export const getScheduleTool = {
  name: "get_schedule",
  description:
    "Lấy thông tin lịch chạy của một tuyến: giờ chạy đầu/cuối, tần suất, số chuyến hôm nay.",
  parameters: {
    type: "object",
    properties: {
      route_id: { type: "integer", description: "ID tuyến" },
      date: {
        type: "string",
        description: "Ngày dạng YYYY-MM-DD (mặc định: hôm nay)",
      },
    },
    required: ["route_id"],
  },
  handler: async ({ route_id, date }) => {
    const schedule = await discoveryService.getRouteSchedule(route_id, date);
    return schedule;
  },
};

/**
 * Tool 4: get_route_detail
 * Chi tiết route để giải thích
 */
export const getRouteDetailTool = {
  name: "get_route_detail",
  description:
    "Lấy chi tiết một tuyến: danh sách trạm, giờ chạy, thời gian di chuyển. " +
    "Dùng khi cần giải thích chi tiết lộ trình cho user.",
  parameters: {
    type: "object",
    properties: {
      route_id: { type: "integer" },
    },
    required: ["route_id"],
  },
  handler: async ({ route_id }) => {
    const detail = await discoveryService.getRouteDetail(route_id);
    return {
      route_id,
      short_name: detail.route?.short_name || detail.short_name,
      full_name: detail.route?.full_name || detail.full_name,
      operating_hours: detail.operating_offset
        ? `${Math.floor(detail.operating_offset.start_seconds / 3600)}:00 - ${Math.floor(detail.operating_offset.end_seconds / 3600)}:00`
        : "05:00 - 21:00",
      total_stops: detail.patterns?.[0]?.stops?.length || 0,
    };
  },
};

export const ALL_TOOLS = [
  resolveLocationTool,
  searchRoutesTool,
  getScheduleTool,
  getRouteDetailTool,
];
