-- Đổi osm_id từ BIGINT → VARCHAR(50) để chứa "way/31096786"
ALTER TABLE road_network
ALTER COLUMN osm_id TYPE VARCHAR(50) USING osm_id::VARCHAR;
