export const SIM_STEP = 1 / 60; // Fixed timestep 60 FPS
export const AVG_SPEED_MPS = 8; // ~29 km/h trung bình
export const MIN_DWELL_SEC = 20; // Dừng trạm tối thiểu
export const MAX_DWELL_SEC = 60; // Dừng trạm tối đa

export const COLORS = {
  go: {
    route: "#169BA2",
    stop: "#0F7075",
    terminal: "#E08940",
    bus: "#169BA2",
  },
  return: {
    route: "#9333EA",
    stop: "#6B21A8",
    terminal: "#E08940",
    bus: "#9333EA",
  },
  depot: "#E08940",
};

export const BUS_STATUS_COLOR = {
  waiting: "#8A9AAA",
  running: "#169BA2",
  stopped: "#E08940",
  done: "#B0BCCA",
};

export const SPEED_PRESETS = [1, 5, 15, 30, 60, 120];
export const DEFAULT_SPEED = 15;
