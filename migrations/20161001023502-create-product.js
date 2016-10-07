'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: { type: Sequelize.STRING ,allowNull: false },
      title: { type: Sequelize.STRING, allowNull: true },
      brand: { type: Sequelize.STRING, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      price: { type: Sequelize.INTEGER, allowNull: true },
      oldPrice: { type: Sequelize.INTEGER, allowNull: true, field: 'old_price' },
      currency: { type: Sequelize.STRING, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, field: 'created_at' },
      updatedAt: { type: Sequelize.DATE, allowNull: false, field: 'updated_at' },
      deletedAt: { type: Sequelize.DATE, field: 'deleted_at' }
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('products');
  }
};
