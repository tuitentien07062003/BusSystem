-- Bật extension để tìm kiếm không dấu + index trigram
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Hàm IMMUTABLE wrapper cho unaccent (bắt buộc để đánh index)
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text AS $$
  SELECT public.unaccent('public.unaccent', $1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

-- Index cho stops
CREATE INDEX IF NOT EXISTS idx_stops_name_unaccent
  ON stops USING gin (immutable_unaccent(stop_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_stops_code_unaccent
  ON stops USING gin (immutable_unaccent(stop_id) gin_trgm_ops);

-- Index cho agencies
CREATE INDEX IF NOT EXISTS idx_agencies_name_unaccent
  ON agencies USING gin (immutable_unaccent(agency_name) gin_trgm_ops);

-- Index cho routes
CREATE INDEX IF NOT EXISTS idx_routes_name_unaccent
  ON routes USING gin (immutable_unaccent(route_full_name) gin_trgm_ops);
