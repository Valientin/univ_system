module.exports = function(sequelize, DataTypes) {
    const Student = sequelize.define('Student', {
        balance: DataTypes.INTEGER
    });

    Student.associate = function(models) {
        Student.belongsTo(models.User, {
            as: 'user',
            foreignKey: 'userId',
            allowNull: false
        });

        Student.belongsTo(models.Group, {
            allowNull: false,
            as: 'group', foreignKey: 'groupId'
        });

        Student.belongsTo(models.LearnForm, {
            allowNull: false,
            as: 'learnForm', foreignKey: 'learnFormId'
        });
    };

    return Student;
};
