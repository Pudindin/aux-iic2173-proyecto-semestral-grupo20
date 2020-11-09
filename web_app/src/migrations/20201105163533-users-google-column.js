'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    queryInterface.addColumn(
      'users',
      'google',
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
    );
  },

  down: async (queryInterface, Sequelize) => {
    queryInterface.removeColumn(
      'users',
      'google',
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
    );
  }
};
