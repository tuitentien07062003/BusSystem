// test-suggest.js
import sequelize from "./config/database.js";
import "./models/associations.js";
import { suggestBlocks } from "./services/dutyAssignmentService.js";

suggestBlocks({
  date: "2026-10-01",
  route_id: 1, // tuyến 19
  shift_template_id: 1, // MORNING
  depot_id: 1, // Bến Thành
})
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch((e) => console.error("ERR:", e.message))
  .finally(() => sequelize.close());
