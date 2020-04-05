module.exports = function(sequelize, DataTypes) {
    const Teacher = sequelize.define('Teacher', {
        additionalInfo: DataTypes.STRING
    });

    Teacher.associate = function(models) {
        Teacher.belongsTo(models.User, {
            as: 'user',
            foreignKey: 'userId',
            allowNull: false
        });
    };

    return Teacher;
};
