-- Override thủ công: admin chọn road cụ thể cho stop
CREATE TABLE IF NOT EXISTS stop_road_override (
  stop_id INTEGER PRIMARY KEY REFERENCES stops(id) ON DELETE CASCADE,
  road_id INTEGER NOT NULL REFERENCES road_network(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stop_road_override_road
ON stop_road_override(road_id);
