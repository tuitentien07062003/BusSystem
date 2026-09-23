-- Bảng road_network: lưu các đường chính (primary/secondary/tertiary/trunk)
-- Import 1 lần từ OSM/Overpass → dùng cho stop matching
CREATE TABLE IF NOT EXISTS road_network (
  id SERIAL PRIMARY KEY,
  osm_id BIGINT,
  name VARCHAR(255),
  highway VARCHAR(50),          -- primary | secondary | tertiary | trunk
  lanes INTEGER,
  oneway VARCHAR(20),
  geom GEOMETRY(LineString, 4326) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_road_network_geom ON road_network USING gist(geom);
CREATE INDEX IF NOT EXISTS idx_road_network_highway ON road_network(highway);
CREATE INDEX IF NOT EXISTS idx_road_network_name ON road_network(name);
