// scripts/import-roads.js
// Import roads GeoJSON → road_network table
//
// Dùng:
//   node scripts/import-roads.js src/roadhcm.geojson [--reset]

import fs from "node:fs";
import path from "node:path";
import sequelize from "../src/config/database.js";
import { QueryTypes } from "sequelize";

const ALLOWED_HIGHWAY = new Set([
  "primary", "secondary", "tertiary", "trunk",
  "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link",
]);
const BATCH_SIZE = 500;

async function run() {
  const file = process.argv[2];
  const reset = process.argv.includes("--reset");

  if (!file) {
    console.error("[X] Cần path file GeoJSON");
    console.error("    node scripts/import-roads.js src/roadhcm.geojson");
    process.exit(1);
  }

  const absPath = path.resolve(file);
  if (!fs.existsSync(absPath)) {
    console.error(`[X] Không tìm thấy: ${absPath}`);
    process.exit(1);
  }

  const stats = fs.statSync(absPath);
  console.log(`[Dir] File: ${absPath} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);

  console.log("[Doc] Đang đọc file...");
  const raw = JSON.parse(fs.readFileSync(absPath, "utf-8"));
  const features = raw.features || [];
  console.log(`[Data] Tổng features: ${features.length}`);

  await sequelize.authenticate();
  console.log("[OK] Kết nối DB");

  if (reset) {
    await sequelize.query("TRUNCATE TABLE road_network RESTART IDENTITY");
    console.log("[Xoa] Đã xoá data cũ");
  }

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  const startTime = Date.now();
  let batch = [];
  const errorSamples = [];

  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const props = f.properties || {};
    const highway = props.highway;

    if (!ALLOWED_HIGHWAY.has(highway)) {
      skipped++;
      continue;
    }

    // Extract coords
    let coords = f.geometry?.coordinates;
    if (!coords || coords.length < 2) {
      if (props.geometry && Array.isArray(props.geometry) && props.geometry.length >= 2) {
        coords = props.geometry.map((p) => [p.lon, p.lat]);
      } else {
        skipped++;
        continue;
      }
    }

    // Filter coords hợp lệ
    coords = coords.filter(
      (c) => Array.isArray(c) && c.length === 2
        && !isNaN(c[0]) && !isNaN(c[1])
        && c[0] >= -180 && c[0] <= 180
        && c[1] >= -90 && c[1] <= 90
    );

    if (coords.length < 2) {
      skipped++;
      continue;
    }

    // Parse osm_id — chấp nhận cả "way/123", "123", 123
    let osmIdRaw = props.id || props["@id"] || null;
    let osmId = null;
    if (osmIdRaw != null) {
      const s = String(osmIdRaw);
      // Nếu có format "way/123" → giữ nguyên
      // Nếu là số → giữ
      // Nếu là chuỗi lạ → giữ (nhưng cột VARCHAR chấp nhận)
      osmId = s.slice(0, 50);
    }

    batch.push({
      osm_id: osmId,
      name: props.name || props["name:vi"] || null,
      highway,
      lanes: props.lanes && !isNaN(parseInt(props.lanes)) ? parseInt(props.lanes) : null,
      oneway: props.oneway || null,
      geom: JSON.stringify({ type: "LineString", coordinates: coords }),
    });

    if (batch.length >= BATCH_SIZE) {
      try {
        await insertBatch(batch);
        imported += batch.length;
      } catch (err) {
        errors += batch.length;
        if (errorSamples.length < 3) {
          errorSamples.push(err.message.slice(0, 200));
        }
      }
      batch = [];

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const pct = ((i / features.length) * 100).toFixed(1);
      process.stdout.write(`\r... ${pct}% | imported: ${imported} | skipped: ${skipped} | errors: ${errors} | ${elapsed}s`);
    }
  }

  // Batch cuối
  if (batch.length > 0) {
    try {
      await insertBatch(batch);
      imported += batch.length;
    } catch (err) {
      errors += batch.length;
      if (errorSamples.length < 3) {
        errorSamples.push(err.message.slice(0, 200));
      }
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n");
  console.log("═══════════════════════════════════════");
  console.log(`IMPORT XONG!`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped:  ${skipped}`);
  console.log(`   Errors:   ${errors}`);
  console.log(`   Time:     ${totalTime}s`);
  console.log("═══════════════════════════════════════");

  if (errorSamples.length > 0) {
    console.log("\n[!] Sample errors:");
    errorSamples.forEach((e, i) => console.log(`   ${i + 1}. ${e}`));
  }

  await sequelize.close();
}

async function insertBatch(rows) {
  const values = [];
  const replacements = {};

  rows.forEach((r, i) => {
    values.push(
      `(:osm_id_${i}, :name_${i}, :highway_${i}, :lanes_${i}, :oneway_${i}, ST_SetSRID(ST_GeomFromGeoJSON(:geom_${i}), 4326))`
    );
    replacements[`osm_id_${i}`] = r.osm_id;
    replacements[`name_${i}`] = r.name;
    replacements[`highway_${i}`] = r.highway;
    replacements[`lanes_${i}`] = r.lanes;
    replacements[`oneway_${i}`] = r.oneway;
    replacements[`geom_${i}`] = r.geom;
  });

  await sequelize.query(
    `INSERT INTO road_network (osm_id, name, highway, lanes, oneway, geom)
     VALUES ${values.join(", ")}`,
    { replacements, type: QueryTypes.INSERT }
  );
}

run().catch((err) => {
  console.error("[X] Fatal:", err);
  process.exit(1);
});
