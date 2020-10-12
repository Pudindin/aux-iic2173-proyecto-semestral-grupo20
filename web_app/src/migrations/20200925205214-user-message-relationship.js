'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    Promise.all([
      queryInterface.removeColumn(
        'messages',
        'user',
        {
          type: Sequelize.STRING,
        },
      ),
      queryInterface.addColumn(
        'messages',
        'userId',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'users',
            key: 'id',
          },
          allowNull: true,
          onUpdate: 'cascade',
          onDelete: 'set null',
        },
      ),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    Promise.all([
      queryInterface.addColumn(
        'messages',
        'user',
        {
          type: Sequelize.STRING,
        },
      ),
      queryInterface.removeColumn(
        'messages',
        'userId',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'users',
            key: 'id',
          },
          allowNull: true,
          onUpdate: 'cascade',
          onDelete: 'set null',
        },
      ),
    ]);
  },
};