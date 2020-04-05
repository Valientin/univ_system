module.exports = function(sequelize, DataTypes) {
    const GroupLesson = sequelize.define('GroupLesson', {
        numberOfLesson: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 10
            }
        },
        dayOfWeek: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 7
            }
        },
        toDate: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });

    GroupLesson.associate = function(models) {
        GroupLesson.belongsTo(models.Group, {
            as: 'group',
            foreignKey: 'groupId',
            allowNull: false
        });

        GroupLesson.belongsTo(models.Lesson, {
            as: 'lesson',
            foreignKey: 'lessonId',
            allowNull: false
        });
    };

    return GroupLesson;
};
