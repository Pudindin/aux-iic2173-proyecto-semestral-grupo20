'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    var rules = {
      "h1": {
          "font-size": "1px"
      }
    };

    rules = JSON.stringify(rules);
    const css_injection_new = [
      {
        css: rules,
        roomId: 1,
        approved: false,
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
