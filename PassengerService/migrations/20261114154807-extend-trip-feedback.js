"use strict";

export default {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    // 1. Cho phép user_id và rating được phép null (để gửi ẩn danh không cần đánh giá sao)
    await queryInterface.changeColumn("trip_feedback", "user_id", {
      type: DataTypes.INTEGER,
      allowNull: true,
    });

    await queryInterface.changeColumn("trip_feedback", "rating", {
      type: DataTypes.INTEGER,
      allowNull: true,
    });

    // 2. Thêm các cột mới
    await queryInterface.addColumn("trip_feedback", "type", {
      type: DataTypes.ENUM("trip", "general"),
      defaultValue: "general", // Phân loại: 'trip' là đánh giá chuyến, 'general' là góp ý
    });

    await queryInterface.addColumn("trip_feedback", "full_name", {
      type: DataTypes.STRING(150),
      allowNull: true,
    });

    await queryInterface.addColumn("trip_feedback", "email", {
      type: DataTypes.STRING(150),
      allowNull: true,
    });

    await queryInterface.addColumn("trip_feedback", "phone", {
      type: DataTypes.STRING(20),
      allowNull: true,
    });

    await queryInterface.addColumn("trip_feedback", "images", {
      type: DataTypes.JSONB,
      defaultValue: [],
    });

    await queryInterface.addColumn("trip_feedback", "status", {
      type: DataTypes.ENUM("new", "reviewed", "resolved"),
      defaultValue: "new",
    });

    await queryInterface.addColumn("trip_feedback", "admin_note", {
      type: DataTypes.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("trip_feedback", "reviewed_by", {
      type: DataTypes.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn("trip_feedback", "reviewed_at", {
      type: DataTypes.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.removeColumn("trip_feedback", "type");
    await queryInterface.removeColumn("trip_feedback", "full_name");
    await queryInterface.removeColumn("trip_feedback", "email");
    await queryInterface.removeColumn("trip_feedback", "phone");
    await queryInterface.removeColumn("trip_feedback", "images");
    await queryInterface.removeColumn("trip_feedback", "status");
    await queryInterface.removeColumn("trip_feedback", "admin_note");
    await queryInterface.removeColumn("trip_feedback", "reviewed_by");
    await queryInterface.removeColumn("trip_feedback", "reviewed_at");

    // Trả lại ràng buộc NOT NULL (nếu cần rollback)
    await queryInterface.changeColumn("trip_feedback", "user_id", {
      type: DataTypes.INTEGER,
      allowNull: false,
    });
    await queryInterface.changeColumn("trip_feedback", "rating", {
      type: DataTypes.INTEGER,
      allowNull: false,
    });
  },
};
