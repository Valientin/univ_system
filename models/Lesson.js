module.exports = function(sequelize, DataTypes) {
    const Lesson = sequelize.define('Lesson', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        semester: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });

    Lesson.associate = function(models) {
        Lesson.belongsTo(models.Teacher, {
            as: 'teacher', foreignKey: {
                name: 'teacherId',
                allowNull: false
            }
        });

        Lesson.hasMany(models.GroupLesson, {
            as: 'groupLesson', foreignKey: 'lessonId'
        });
    };

    return Lesson;
};
