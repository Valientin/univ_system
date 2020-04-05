module.exports = function(sequelize, DataTypes) {
    const Group = sequelize.define('Group', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        startYear: {
            type: DataTypes.DATE,
            allowNull: false
        },
        courseCount: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });

    Group.associate = function(models) {
        Group.belongsTo(models.Cathedra, {
            as: 'cathedra', foreignKey: 'cathedraId'
        });
    };

    return Group;
};
