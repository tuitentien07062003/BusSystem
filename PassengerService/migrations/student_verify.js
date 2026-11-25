"use strict";

export default {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;
    await queryInterface.addColumn("student_verifications", "enrollment_year", {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("student_verifications", "graduation_year", {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn(
      "student_verifications",
      "student_card_image",
      {
        type: DataTypes.TEXT, // Lưu Base64
        allowNull: true,
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(
      "student_verifications",
      "enrollment_year",
    );
    await queryInterface.removeColumn(
      "student_verifications",
      "graduation_year",
    );
    await queryInterface.removeColumn(
      "student_verifications",
      "student_card_image",
    );
  },
};
