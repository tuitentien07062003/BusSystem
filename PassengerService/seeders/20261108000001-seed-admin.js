"use strict";
import bcrypt from "bcrypt";

export default {
  async up(queryInterface) {
    const now = new Date();
    const hash = await bcrypt.hash("Admin@123", 10);

    await queryInterface.bulkInsert("users", [
      {
        username: "admin",
        email: "admin@tbus.vn",
        phone: "0900000000",
        password_hash: hash,
        full_name: "System Admin",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    const [admins] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE username = 'admin' LIMIT 1`,
    );

    await queryInterface.bulkInsert("user_roles", [
      { user_id: admins[0].id, role: "ADMIN", created_at: now },
    ]);

    // Seed passenger test
    const passHash = await bcrypt.hash("Pass@123", 10);
    await queryInterface.bulkInsert("users", [
      {
        username: "passenger1",
        email: "p1@tbus.vn",
        phone: "0901111111",
        password_hash: passHash,
        full_name: "Khách Test 1",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    const [passengers] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE username = 'passenger1' LIMIT 1`,
    );

    await queryInterface.bulkInsert("user_roles", [
      { user_id: passengers[0].id, role: "PASSENGER", created_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("user_roles", null, {});
    await queryInterface.bulkDelete("users", null, {});
  },
};
