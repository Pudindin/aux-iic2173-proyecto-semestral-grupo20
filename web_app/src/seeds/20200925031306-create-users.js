const bcrypt = require('bcrypt');

const PASSWORD_SALT = 10;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const adminUsers = [
      {
        username: 'dhvasquez#1',
        email: 'dhvasquez@uc.cl',
        password: bcrypt.hashSync('123', PASSWORD_SALT),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    return queryInterface.bulkInsert('users', adminUsers);
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
