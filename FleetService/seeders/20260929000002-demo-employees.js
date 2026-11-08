const depotDistribution = [
  { depot: 1, count: 15, prefix: "BT" }, // Bến Thành
  { depot: 2, count: 10, prefix: "MT" }, // Miền Tây
  { depot: 3, count: 5, prefix: "VH" }, // Vinhomes
];

export default {
  async up(queryInterface) {
    const now = new Date();

    // ═══ Vehicle types ═══
    await queryInterface.bulkInsert("vehicle_types", [
      {
        type_code: "BUS_45",
        name: "Xe buýt 45 chỗ",
        capacity_seated: 45,
        capacity_standing: 0,
        is_accessible: false,
      },
      {
        type_code: "BUS_65",
        name: "Xe buýt 65 chỗ",
        capacity_seated: 65,
        capacity_standing: 0,
        is_accessible: false,
      },
      {
        type_code: "EBUS_60",
        name: "Xe buýt điện 60 chỗ",
        capacity_seated: 60,
        capacity_standing: 0,
        is_accessible: true,
      },
    ]);

    const [types] = await queryInterface.sequelize.query(
      `SELECT id, type_code FROM vehicle_types ORDER BY id`,
    );
    const typeMap = new Map(types.map((t) => [t.type_code, t.id]));

    // ═══ 30 vehicles ═══
    const vehicles = [];
    let idx = 1;

    for (const d of depotDistribution) {
      for (let i = 0; i < d.count; i++) {
        const typeCode =
          i % 3 === 0 ? "EBUS_60" : i % 2 === 0 ? "BUS_65" : "BUS_45";
        const typeId = typeMap.get(typeCode);

        vehicles.push({
          vehicle_code: `XE_${String(idx).padStart(3, "0")}`,
          license_plate: `51B-${String(10000 + idx).slice(-5)}`,
          vehicle_type_id: typeId,
          capacity_seated:
            typeCode === "BUS_45" ? 45 : typeCode === "BUS_65" ? 65 : 60,
          capacity_standing: 0,
          battery_capacity_kwh: typeCode === "EBUS_60" ? 350.0 : null,
          range_km: typeCode === "EBUS_60" ? 280 : null,
          depot_id: d.depot,
          is_active: true,
          created_at: now,
          updated_at: now,
        });
        idx++;
      }
    }

    await queryInterface.bulkInsert("vehicles", vehicles);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("vehicles", null, {});
    await queryInterface.bulkDelete("vehicle_types", null, {});
  },
};
