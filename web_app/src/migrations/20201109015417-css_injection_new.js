'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('css_injection_news', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      css: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      roomId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'rooms',
          key: 'id',
        },
      },
      approved: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      checked: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('css_injection_news');
  },
};
