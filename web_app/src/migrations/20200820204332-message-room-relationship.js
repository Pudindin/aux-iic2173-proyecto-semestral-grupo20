'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    Promise.all([
      queryInterface.addColumn(
        'messages',
        'roomId',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'rooms',
            key: 'id',
          },
          allowNull: true,
          onUpdate: 'cascade',
          onDelete: 'cascade',
        },
      ),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    Promise.all([
      queryInterface.removeColumn(
        'messages',
        'roomId',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'rooms',
            key: 'id',
          },
          allowNull: true,
          onUpdate: 'cascade',
          onDelete: 'cascade',
        },
      ),
    ]);
  },
};
