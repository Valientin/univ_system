module.exports = function(sequelize, DataTypes) {
    const GroupLesson = sequelize.define('GroupLesson', {
        toDate: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });

    GroupLesson.associate = function(models) {
        GroupLesson.belongsTo(models.Group, {
            as: 'group',
            foreignKey: {
                name: 'groupId',
                allowNull: false
            }
        });

        GroupLesson.belongsTo(models.Lesson, {
            as: 'lesson',
            foreignKey: {
                name: 'lessonId',
                allowNull: false
            }
        });
    };

    return GroupLesson;
};
