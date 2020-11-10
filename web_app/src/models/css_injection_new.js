'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class css_injection_new extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      css_injection_new.belongsTo(models.room);
    }
  };
  css_injection_new.init({
    roomId: DataTypes.INTEGER,
    type: DataTypes.STRING,
    code: DataTypes.TEXT,
    approved: DataTypes.BOOLEAN,
    checked: DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'css_injection_new',
  });
  return css_injection_new;
};