'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    var rules = {
      backgroundColor: "blue"
    };

    rules = JSON.stringify(rules);
    const css_injection_new = [
      {
        type: 'css',
        code: rules,
        roomId: 1,
        approved: false,
        checked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    return queryInterface.bulkInsert('css_injection_news', css_injection_new);
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
