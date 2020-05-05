module.exports = function(sequelize, DataTypes) {
    const Student = sequelize.define('Student', {
        balance: DataTypes.INTEGER
    });

    Student.associate = function(models) {
        Student.belongsTo(models.User, {
            as: 'user',
            foreignKey: {
                name: 'userId',
                allowNull: false
            }
        });

        Student.belongsTo(models.Group, {
            as: 'group', foreignKey: {
                name: 'groupId',
                allowNull: false
            }
        });

        Student.belongsTo(models.LearnForm, {
            as: 'learnForm', foreignKey: {
                name: 'learnFormId',
                allowNull: false
            }
        });
    };

    return Student;
};
