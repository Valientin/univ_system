module.exports = function(sequelize, DataTypes) {
    const Group = sequelize.define('Group', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        numberOfSemesters: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });

    Group.associate = function(models) {
        Group.belongsTo(models.Cathedra, {
            as: 'cathedra', foreignKey: {
                name: 'cathedraId',
                allowNull: false
            }
        });
    };

    return Group;
};
