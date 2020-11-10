'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const rooms = [
      {
        name: 'Test Room',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    return queryInterface.bulkInsert('rooms', rooms);
  },
  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
