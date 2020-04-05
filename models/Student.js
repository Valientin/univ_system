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
            as: 'group', foreignKey: 'groupId'
        });

        Student.belongsTo(models.LearnForm, {
            as: 'learnForm', foreignKey: 'learnFormId'
        });
    };

    return Student;
};
