'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const newRoom = [
      {
        name: 'Test Room',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    return queryInterface.bulkInsert('rooms', newRoom);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
