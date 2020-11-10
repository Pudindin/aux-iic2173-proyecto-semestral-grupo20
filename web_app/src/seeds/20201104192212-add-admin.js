const bcrypt = require('bcrypt');

const PASSWORD_SALT = 10;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const adminUsers = [
      {
        username: 'admin#0',
        email: 'admin@openchat.com',
        password: bcrypt.hashSync('123123', PASSWORD_SALT),
        createdAt: new Date(),
        updatedAt: new Date(),
        admin: true,
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
  },
};
