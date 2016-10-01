module.exports = function (sequelize, DataTypes) {
    var Product = sequelize.define('Product', {
        id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
        title: { type: DataTypes.STRING, allowNull: true },
        brand: { type: DataTypes.STRING, allowNull: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        price: { type: DataTypes.INTEGER, allowNull: true },
        oldPrice: { type: DataTypes.INTEGER, allowNull: true, field: 'old_price' },
        currency: { type: DataTypes.STRING, allowNull: true }
    }, {
        tableName: 'products',
        underscored: true,
        paranoid: true,
        classMethods: {
            associate: function (models) {

            }
        }
    })

    return Product;
}